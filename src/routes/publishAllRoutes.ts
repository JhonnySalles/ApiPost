import { Router, Request, Response } from 'express';
import { protect } from '../middleware/authMiddleware';
import Logger from '../config/logger';
import * as Sentry from '@sentry/node';
import { io } from '../server';
import { BASE_DOCUMENT, db } from '../services/firebaseService';
import { uploadImage } from '../services/cloudinaryService';

import { handleTumblrPost } from './tumblrRoutes';
import { handleTwitterPost } from './twitterRoutes';
import { handleBlueskyPost } from './blueskyRoutes';
import { handleThreadsPost } from './threadsRoutes';
import { BLUESKY, Platform, THREADS, TUMBLR, TWITTER, X } from '../constants/platforms';
import { ValidationError } from '../errors/ValidationError';

const router = Router();

interface ImagePayload {
    base64: string;
    platforms?: Platform[];
}

interface PublishAllPayload {
    platforms: Platform[];
    text?: string;
    images?: ImagePayload[];
    tags?: string[];
    socketId?: string;
    instanceId?: string;
    postId?: string;
    platformOptions?: {
        tumblr?: {
            blogName: string;
        }
    };
}

async function processPublishAllRequest(payload: PublishAllPayload) {
    const { platforms, text, images, tags, socketId, platformOptions, instanceId, postId } = payload;
    const totalPlatforms = platforms.length;

    const successfulPlatforms: string[] = [];
    const failedPlatforms: { platform: string; reason: string }[] = [];

    const dbRef = (instanceId && postId) ? db.ref(`${BASE_DOCUMENT}/${instanceId}/${postId}`) : null;

    Logger.info(`[Publish All] Iniciando postagem em ${totalPlatforms} plataformas (${platforms}).`);

    let imagesUrls: string[] | undefined = undefined;

    if (images && images.length > 0 && (platforms.includes(TUMBLR) || platforms.includes(THREADS))) {
        try {
            Logger.info(`[Publish All] Fazendo upload de ${images.length} imagem(ns) para o Cloudinary...`);
            const allImagesBase64 = images.map(img => img.base64);
            imagesUrls = await Promise.all(allImagesBase64.map(base64 => uploadImage(base64)));
        } catch (error: any) {
            Logger.error(`[Publish All] Falha crítica no upload para o Cloudinary: ${error.message}`);
            Sentry.captureException(error);
        }
    }

    for (let i = 0; i < totalPlatforms; i++) {
        const platform = platforms[i];
        const progress = Math.round(((i + 1) / totalPlatforms) * 100);
        let status: 'success' | 'scheduled' | 'error' = 'success';
        let errorDetails: string | null = null;
        let publishTime: string | undefined = undefined;

        const imagesPost = images?.filter(image => !image.platforms || image.platforms.length === 0 || image.platforms.includes(platform)).map(image => image.base64);
        const urlsPost = (imagesUrls && (platform === TUMBLR || platform === THREADS)) ? images?.map((image, index) => ({ ...image, url: imagesUrls[index] })).filter(image => !image.platforms || image.platforms.length === 0 || image.platforms.includes(platform)).map(image => image.url) : undefined;

        try {
            Logger.info(`[Publish All] Processando plataforma: ${platform} (${i + 1}/${totalPlatforms})`);
            switch (platform) {
                case TUMBLR:
                    if (!platformOptions?.tumblr?.blogName)
                        throw new ValidationError('blogName é obrigatório para o Tumblr.');
                    const result = await handleTumblrPost({ text, images: imagesPost, urls: urlsPost, tags, instanceId, postId, ...platformOptions.tumblr });
                    publishTime = result.publishTime;
                    status = result.scheduled ? 'scheduled' : (result.success ? 'success' : 'error');
                    break;
                case X:
                case TWITTER:
                    const listX = imagesPost && imagesPost.length > 4 ? imagesPost.slice(0, 4) : imagesPost;
                    status = await handleTwitterPost({ text: text || '', images: listX, tags, instanceId, postId }) ? 'success' : 'error';
                    break;
                case BLUESKY:
                    const listBluesky = imagesPost && imagesPost.length > 4 ? imagesPost.slice(0, 4) : imagesPost;
                    status = await handleBlueskyPost({ text: text || '', images: listBluesky, tags, instanceId, postId }) ? 'success' : 'error';
                    break;
                case THREADS:
                    status = await handleThreadsPost({ text: text || '', images: imagesPost, urls: urlsPost, tags, instanceId, postId }) ? 'success' : 'error';
                    break;
                default:
                    throw new ValidationError(`Plataforma desconhecida: ${platform}`);
            }
            Logger.info(`[Publish All] Sucesso ao postar em: ${platform}`);

            successfulPlatforms.push(platform);
        } catch (error: any) {
            status = 'error';
            errorDetails = error.message || 'Erro desconhecido';
            failedPlatforms.push({ platform, reason: errorDetails || 'Erro desconhecido' });
            Logger.error(`[Publish All] Falha ao postar em ${platform}: %o`, error);

            // prettier-ignore
            if (!(error instanceof ValidationError))
                Sentry.captureException(error, { extra: { platform } });
        }

        if (socketId) {
            io.to(socketId).emit('progressUpdate', {
                type: 'progress',
                platform,
                status,
                progress,
                error: errorDetails,
                publishTime,
            });
        }
    }

    if (dbRef) {
        Logger.info(`[Publish All] Gravando sumário final no Firebase para o job: ${postId}`);
        try {
            await dbRef.update({
                _summary: {
                    status: 'completed',
                    completedAt: new Date().toISOString(),
                    successful: successfulPlatforms,
                    failed: failedPlatforms,
                }
            });
        } catch (dbError) {
            Logger.error(`[Publish All] Falha ao gravar sumário no Firebase para o job ${postId}:`, dbError);
            Sentry.captureException(dbError);
        }
    }

    if (socketId) {
        Logger.info(`[Publish All] Enviando sumário final para o socket: ${socketId}`);
        io.to(socketId).emit('taskCompleted', {
            type: 'summary',
            status: 'completed',
            summary: {
                successful: successfulPlatforms,
                failed: failedPlatforms,
            }
        });
    }

    Logger.info(`[Publish All] Processamento concluído.`);
}

/**
 * @openapi
 * /publish-all/post:
 *  post:
 *    summary: Posta em múltiplas plataformas de uma vez.
 *    tags: [Publish All]
 *    description: |
 *                 Inicia um processo de postagem assíncrona para múltiplas plataformas de mídia social. Este é o endpoint principal e recomendado para a maioria das operações. A API responde imediatamente confirmando o recebimento da tarefa e reporta o progresso e o resultado final em tempo real através de uma conexão WebSocket estabelecida previamente.
 *               
 *                 **Fluxo de Execução:**
 *                 1. O aplicativo cliente deve primeiro estabelecer uma conexão WebSocket com o servidor para obter um `socketId` único.
 *                 2. O cliente envia uma requisição `POST` para este endpoint com o `socketId` e o conteúdo a ser postado.
 *                 3. A API valida a requisição, responde imediatamente com o status `202 Accepted` e inicia o processamento em segundo plano.
 *                 4. Para cada plataforma processada, a API emite um evento `progressUpdate` para o `socketId` do cliente.
 *                 5. Ao final de todas as tentativas, a API emite um evento `taskCompleted` com um sumário completo da operação.
 *               
 *                 **Corpo da Requisição:**
 *                 * **`platforms`** (array de strings, obrigatório): Lista das plataformas onde o conteúdo será publicado. Valores válidos: `tumblr`, `twitter`, `bluesky`, `threads`.
 *                 * **`socketId`** (string, obrigatório): O ID da conexão WebSocket do cliente, usado para receber os retornos de progresso.
 *                 * **`instanceId`** (string, opcional): ID da instância do app cliente para rastreamento no Firebase.
 *                 * **`postId`** (string, opcional): ID do post gerado pelo app cliente para rastreamento no Firebase.
 *                 * **`text`** (string, opcional): O conteúdo de texto principal do post.
 *                 * **`images`** (array de objetos, opcional): Lista de imagens a serem publicadas.
 *                   * `base64`: A imagem no formato Data URL (`data:image/jpeg;base64,...`).
 *                   * `platforms`: (opcional) Um array especificando em quais plataformas esta imagem específica deve ser publicada. Se omitido, a imagem é enviada para todas as plataformas listadas na raiz da requisição.
 *                 * **`tags`** (array de strings, opcional): Uma lista de tags a serem associadas ao post. A formatação (`#hashtag`) e as limitações (ex: apenas a primeira tag no Threads) são tratadas pela API para cada plataforma.
 *                 * **`platformOptions`** (objeto, opcional): Um objeto para fornecer parâmetros específicos de cada plataforma.
 *                   * `tumblr`: Requer a propriedade `blogName` (string) para identificar o blog de destino.
 *               
 *                 **Corpo da Resposta:**
 *                 * Retorna imediatamente uma resposta de sucesso (status `202 Accepted`) indicando que a tarefa foi recebida e iniciada. O resultado detalhado é enviado via WebSocket.
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              platforms:
 *                type: array
 *                items:
 *                  type: string
 *                  enum: [tumblr, twitter, bluesky, threads]
 *                example: [tumblr, twitter, bluesky, threads]
 *              instanceId:
 *                type: string
 *                description: ID da instância do app cliente para rastreamento no Firebase.
 *                example: "asdffasdfFMaxwBvUw49LOjc2"
 *              postId:
 *                type: string
 *                description: "153"
 *              text:
 *                type: string
 *                example: "Olá, mundo!"
 *              images:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/ImagePayload'
 *                example: [{ base64: "data:image/jpeg;base64,...", platforms: ["twitter"] }, { base64: "data:image/png;base64,...", platforms: ["tumblr"] }, { base64: "data:image/gif;base64,...", platforms: ["twitter", "tumblr"] }]
 *              tags:
 *                type: array
 *                items:
 *                  type: string
 *              socketId:
 *                type: string
 *                description: O ID da conexão WebSocket do cliente.
 *                example: "RjBTZ40hhTk1T7mDAAAB"
 *              platformOptions:
 *                type: object
 *                properties:
 *                  tumblr:
 *                    type: object
 *                    properties:
 *                      blogName: { type: string, example: "meu-blog-principal" }
 *    responses:
 *      '202':
 *        description: Processamento aceito e iniciado em segundo plano.
 */
router.post('/post', protect, (req: Request, res: Response) => {
    const payload = req.body as PublishAllPayload;

    if (!payload.platforms || payload.platforms.length === 0)
        return res.status(400).json({ message: 'O array de plataformas é obrigatório.' });

    res.status(202).json({ message: 'Processamento em lote iniciado. Você será notificado via callback.' });
    processPublishAllRequest(payload);
});

export default router;