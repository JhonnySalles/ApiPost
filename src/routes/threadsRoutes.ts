import { Router, Request, Response } from 'express';
import Logger from '../config/logger';
import * as Sentry from '@sentry/node';
import { protect } from '../middleware/authMiddleware';
import { uploadImage } from '../services/cloudinaryService';
import { ThreadsApiError, ThreadsAuthenticatedApiClient } from '@libs/threads-graph-api/index.js';
import { toTitleCase } from '../utils/texts';
import { BASE_DOCUMENT, db } from '../services/firebaseService';
import { ValidationError } from '../errors/ValidationError';

const router = Router();

interface ThreadsPostOptions {
    text?: string;
    images?: string[];
    urls?: string[];
    tags?: string[];
    instanceId?: string;
    postId?: string;
}

export async function handleThreadsPost(options: ThreadsPostOptions) {
    const { text, images, urls, tags, instanceId, postId } = options;
    const hasText = text && text.trim().length > 0;
    const hasImages = (images && images.length > 0) || (urls && urls.length > 0);

    if (!hasText && !hasImages)
        throw new ValidationError('Threads: É necessário fornecer texto ou imagens para o Threads.');

    const { THREADS_ACCESS_TOKEN, THREADS_USER_ID } = process.env;
    if (!THREADS_ACCESS_TOKEN || !THREADS_USER_ID)
        throw new ValidationError('Threads: Credenciais da Threads Graph API não configuradas no .env');

    let debugLog = '';

    const dbRef = (instanceId && postId) ? db.ref(`${BASE_DOCUMENT}/${instanceId}/${postId}`) : null;

    try {
        const client = new ThreadsAuthenticatedApiClient(THREADS_ACCESS_TOKEN, THREADS_USER_ID);

        let topicTag: string | undefined = undefined;
        if (tags && tags.length > 0) {
            const firstTag = tags.find(tag => tag && tag.trim() !== '');

            if (firstTag) {
                let processedTag = toTitleCase(firstTag).replace(/[\s-]/g, '');
                processedTag = processedTag.replace(/[.&@!?,;:]/g, '');
                const isNumeric = processedTag.trim() && !isNaN(Number(processedTag));

                if (processedTag.trim() && !isNumeric) {
                    if (processedTag.length > 50)
                        topicTag = processedTag.substring(0, 50);
                    else
                        topicTag = processedTag;
                }
            }
        }

        let creationId: string;
        if (process.env.IGNORAR_POST) {
            creationId = '1';
            Logger.warn(`[Threads] Ignorado o envio do post.`);
            await new Promise(resolve => setTimeout(resolve, (Math.floor(Math.random() * 5) + 1) * 1000));

            if (Math.random() < 0.3) {
                Logger.warn(`[Threads] Simulando uma falha (30% de chance).`);
                throw new Error('Teste de excessão');
            }
        } else if (!hasImages) {
            Logger.info('[Threads] Criando post de texto...');
            const response = await client.createMediaContainer({
                mediaType: 'TEXT',
                text: (text || "").replace("\t", ""),
                topicTag: topicTag,
            });
            creationId = response.id;
        } else {
            let imageUrls: string[] = urls || [];

            if (imageUrls.length === 0 && images && images.length > 0) {
                Logger.info(`[Threads] Fazendo upload de ${images.length} imagem(ns) para o Cloudinary...`);
                imageUrls = await Promise.all(images.map(base64 => uploadImage(base64)));
            }

            if (imageUrls.length === 1) {
                Logger.info('[Threads] Criando post de imagem única...');
                const response = await client.createMediaContainer({
                    mediaType: 'IMAGE',
                    text: text ? text.replace("\t", "") : undefined,
                    imageUrl: imageUrls[0],
                    topicTag: topicTag,
                });
                creationId = response.id;
            } else {
                Logger.info('[Threads] Criando contêineres de itens para o carrossel...');
                const itemContainerIds = await Promise.all(
                    imageUrls.map(url =>
                        client.createMediaContainer({
                            mediaType: 'IMAGE',
                            imageUrl: url,
                            isCarouselItem: true,
                        }).then(res => res.id)
                    )
                );

                let finalText = text || '';
                if (topicTag && topicTag.length > 0) {
                    const hashtags = `#${topicTag.replace(/ /g, '')}`;
                    finalText = finalText ? `${hashtags}\n${finalText}` : hashtags;
                }

                Logger.info('[Threads] Criando contêiner principal do carrossel...');
                debugLog += `\nParâmetros para o contêiner principal do carrossel:\n${JSON.stringify({ mediaType: 'CAROUSEL', text: finalText ? finalText.replace("\t", "") : undefined, children: itemContainerIds, }, null, 2)}\n`;
                const carouselContainer = await client.createMediaContainer({
                    mediaType: 'CAROUSEL',
                    text: finalText ? finalText.replace("\t", "") : undefined,
                    children: itemContainerIds,
                });
                creationId = carouselContainer.id;
            }
        }

        const { id: postId } = process.env.IGNORAR_POST ? { id: `[Tumblr] Ignorado o envio do post.` } : await client.publish({ creationId });

        if (dbRef)
            await dbRef.update({ threads: { status: 'success', error: null, } });

        Logger.info(`[Threads] Publicando contêiner com sucesso! ID: ${creationId}`);
        return { success: true, data: { postId } };
    } catch (error) {
        debugLog += `\nERRO CAPTURADO: ${error instanceof Error ? error.message : String(error)}`;
        Sentry.captureException(error, {
            extra: {
                threadsDebugLog: debugLog,
            },
        });

        try {
            Logger.info('[Firebase] Gravando log de erro detalhado...');
            const errorLogRef = db.ref('post_errors');
            await errorLogRef.push({
                timestamp: new Date().toISOString(),
                platform: 'threads',
                errorMessage: error,
                fullError: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error))),
                debugTrace: debugLog,
                postId: postId || null,
            });
            Logger.info('[Firebase] Log de erro gravado com sucesso.');
        } catch (dbError) {
            Logger.error('[Firebase] Falha CRÍTICA ao gravar o log de erro no Firebase:', dbError);
            Sentry.captureException(dbError);
        }

        if (error instanceof ThreadsApiError) {
            const apiError = error.getThreadsError();
            Logger.error('[Threads] Erro da API do Threads: %s - Detalhes: %o -- Debug: %o', error.message, apiError, {
                threadsDebugLog: debugLog
            });

            if (dbRef)
                await dbRef.update({ threads: { status: 'error', error: error.message || 'Erro ao postar no Threads.' } });

            throw new Error(`Erro da API do Threads: ${apiError?.error?.message || error.message}`);
        }
        Logger.error('[Threads] Erro ao postar no Threads: %o -- Debug: %o', error, {
            threadsDebugLog: debugLog
        });

        if (dbRef)
            await dbRef.update({ threads: { status: 'error', error: (error && error instanceof Error ? error.message : 'Erro ao postar no Threads.') } });

        throw error;
    }
}

/**
 * @openapi
 * /threads/post:
 *  post:
 *    summary: Cria um novo post no Threads.
 *    tags: [Threads]
 *    description: |
 *                 Publica um novo post no Threads. A função se adapta ao conteúdo fornecido:
 *                 1.  **Apenas Texto:** Cria um post de texto simples.
 *                 2.  **Texto e 1 Imagem:** Cria um post de imagem única com legenda.
 *                 3.  **Texto e 2+ Imagens:** Cria um post em carrossel.
 *                 
 *                 **Corpo da Requisição:**
 *                 * **`text`** (string, opcional): O conteúdo do post, que servirá como legenda para posts com imagem/carrossel.
 *                 * **`images`** (array, opcional): Uma lista de imagens no formato Data URL (base64). As imagens são primeiro enviadas para um serviço de hospedagem (Cloudinary) para gerar URLs públicas.
 *                 * **`tags`** (array, opcional): Apenas a **primeira tag** da lista será usada como `topic_tag` ou adicionada como hashtag, de acordo com as regras da API do Threads para cada tipo de post.
 *                 * **`instanceId`** (string, opcional): ID da instância do app cliente para rastreamento no Firebase.
 *                 * **`postId`** (string, opcional): ID do post gerado pelo app cliente para rastreamento no Firebase.
 *                 
 *                 **Corpo da Resposta:**
 *                 * Retorna um objeto com o ID do post criado com sucesso (status `201 Created`).
 *                 * Retorna um erro `400 Bad Request` se os dados forem insuficientes (sem texto ou imagem).
 *    security:
 *      - bearerAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            allOf:
 *              - $ref: '#/components/schemas/SocialPostRequest'
 *              - type: object
 *                properties:
 *                  text: { type: string }
 *                  images: { type: array, items: { type: base64 } }
 *                  tags: { type: array, items: { type: string } }
 *                  instanceId: { type: string }
 *                  postId: { type: string }
 *          example:
 *            text: "Este é um tweet de exemplo!"
 *            tags: ["api", "teste"]
 *            images: ["data:image/png;base64,iVBORw0KGgo..."]
 *            instanceId: "asdffasdfFMaxwBvUw49LOjc2"
 *            postId: "153"
 *    responses:
 *      '200':
 *        description: Post criado com sucesso.
 */
router.post('/post', protect, async (req: Request, res: Response) => {
    try {
        const result = await handleThreadsPost(req.body);
        res.status(200).json({ message: 'Post criado com sucesso!', ...result });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Erro ao postar no Threads.' });
    }
});

export default router;