import { Router, Request, Response } from 'express';
import { protect } from '../middleware/authMiddleware';
import Logger from '../config/logger';
import * as Sentry from '@sentry/node';
import { io } from '../server';

import { handleTumblrPost } from './tumblrRoutes';
import { handleTwitterPost } from './twitterRoutes';
import { handleBlueskyPost } from './blueskyRoutes';
import { handleThreadsPost } from './threadsRoutes';

const router = Router();

interface ImagePayload {
    base64: string;
    platforms?: ('tumblr' | 'x' | 'twitter' | 'bluesky' | 'threads')[];
}

interface PublishAllPayload {
    platforms: ('tumblr' | 'x' | 'twitter' | 'bluesky' | 'threads')[];
    text?: string;
    images?: ImagePayload[];
    tags?: string[];
    socketId?: string;
    platformOptions?: {
        tumblr?: {
            blogName: string;
        }
    };
}

async function processPublishAllRequest(payload: PublishAllPayload) {
    const { platforms, text, images, tags, socketId, platformOptions } = payload;
    const totalPlatforms = platforms.length;

    const successfulPlatforms: string[] = [];
    const failedPlatforms: { platform: string; reason: string }[] = [];

    Logger.info(`[Publish All] Iniciando postagem em ${totalPlatforms} plataformas (${platforms}).`);

    for (let i = 0; i < totalPlatforms; i++) {
        const platform = platforms[i];
        const progress = Math.round(((i + 1) / totalPlatforms) * 100);
        let status: 'success' | 'error' = 'success';
        let errorDetails: string | null = null;

        const imagesPost = images?.filter(image => !image.platforms || image.platforms.length === 0 || image.platforms.includes(platform))
            .map(image => image.base64);

        try {
            Logger.info(`[Publish All] Processando plataforma: ${platform} (${i + 1}/${totalPlatforms})`);
            switch (platform) {
                case 'tumblr':
                    if (!platformOptions?.tumblr?.blogName)
                        throw new Error('blogName é obrigatório para o Tumblr.');
                    await handleTumblrPost({ text, images: imagesPost, tags, ...platformOptions.tumblr });
                    break;
                case 'x':
                case 'twitter':
                    const listX = imagesPost && imagesPost.length > 4 ? imagesPost.slice(0, 4) : imagesPost;
                    await handleTwitterPost({ text: text || '', images: listX, tags });
                    break;
                case 'bluesky':
                    const listBluesky = imagesPost && imagesPost.length > 4 ? imagesPost.slice(0, 4) : imagesPost;
                    await handleBlueskyPost({ text: text || '', images: listBluesky, tags });
                    break;
                case 'threads':
                    await handleThreadsPost({ text: text || '', images: imagesPost, tags });
                    break;
                default:
                    throw new Error(`Plataforma desconhecida: ${platform}`);
            }
            Logger.info(`[Publish All] Sucesso ao postar em: ${platform}`);

            await new Promise(resolve => setTimeout(resolve, 3000));
            successfulPlatforms.push(platform);
        } catch (error: any) {
            status = 'error';
            errorDetails = error.message || 'Erro desconhecido';
            failedPlatforms.push({ platform, reason: errorDetails || 'Erro desconhecido' });
            Logger.error(`[Publish All] Falha ao postar em ${platform}: %o`, error);
            Sentry.captureException(error, { extra: { platform } });
        }

        if (socketId) {
            io.to(socketId).emit('progressUpdate', {
                type: 'progress',
                platform,
                status,
                progress,
                error: errorDetails,
            });
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