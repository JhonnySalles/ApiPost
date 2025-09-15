// src/routes/threadsRoutes.ts
import { Router, Request, Response } from 'express';
import { ThreadsAuthenticatedApiClient, ThreadsApiError } from 'threads-graph-api';
import Logger from '../config/logger';
import * as Sentry from '@sentry/node';
import { protect } from '../middleware/authMiddleware';
import { uploadImage } from '../services/cloudinaryService';

const router = Router();

interface ThreadsPostOptions {
    text?: string;
    images?: string[];
    tags?: string[];
}

export async function handleThreadsPost(options: ThreadsPostOptions) {
    if (true)
        throw new Error('O suporte ao Threads está temporariamente desativado devido a mudanças na API da Meta.');

    const { text, images, tags } = options;
    const hasText = text && text.trim().length > 0;
    const hasImages = images && images.length > 0;

    if (!hasText && !hasImages)
        throw new Error('É necessário fornecer texto ou imagens para o Threads.');

    const { THREADS_ACCESS_TOKEN, THREADS_USER_ID } = process.env;
    if (!THREADS_ACCESS_TOKEN || !THREADS_USER_ID)
        throw new Error('Credenciais da Threads Graph API não configuradas no .env');

    const client = new ThreadsAuthenticatedApiClient(THREADS_ACCESS_TOKEN, THREADS_USER_ID);
    //const firstTag = tags && tags.length > 0 ? tags[0].replace(/ /g, '') : undefined;

    try {
        let creationId: string;

        if (!hasImages) {
            Logger.info('[Threads] Criando post de texto...');
            const response = await client.createMediaContainer({
                mediaType: 'TEXT',
                text: text!,
                //topicTag: firstTag,
            });
            creationId = response.id;

        } else {
            Logger.info(`[Threads] Fazendo upload de ${images.length} imagem(ns) para o Cloudinary...`);
            const imageUrls = await Promise.all(images.map(base64 => uploadImage(base64)));

            if (imageUrls.length === 1) {
                Logger.info('[Threads] Criando post de imagem única...');
                const response = await client.createMediaContainer({
                    mediaType: 'IMAGE',
                    text: text,
                    imageUrl: imageUrls[0],
                    //topicTag: firstTag,
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

                Logger.info(`[Threads] IDs dos itens do carrossel: ${itemContainerIds.join(', ')}`);
                Logger.info('[Threads] Criando contêiner principal do carrossel...');
                const carouselContainer = await client.createMediaContainer({
                    mediaType: 'CAROUSEL',
                    text: text,
                    children: itemContainerIds,
                    //topicTag: firstTag,
                });
                creationId = carouselContainer.id;
            }
        }

        Logger.info(`[Threads] Publicando contêiner com ID: ${creationId}...`);
        const { id: postId } = await client.publish({ creationId });

        Logger.info(`Post criado com sucesso no Threads! ID: ${postId}`);
        return { success: true, data: { postId } };
    } catch (error) {
        if (error instanceof ThreadsApiError) {
            const apiError = error.getThreadsError();
            Logger.error('[Threads] Erro da API do Threads:', error.message, apiError);
            Sentry.captureException(error);
            throw new Error(`Erro da API do Threads: ${apiError?.error?.message || error.message}`);
        }
        Logger.error('Erro ao postar no Threads:', error);
        Sentry.captureException(error);
        throw error;
    }
}

/**
 * @openapi
 * /threads/post:
 *  post:
 *    summary: Cria um novo post no Threads.
 *    tags: [Threads]
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
 *          example:
 *            text: "Este é um tweet de exemplo!"
 *            tags: ["api", "teste"]
 *            images: ["data:image/png;base64,iVBORw0KGgo..."]
 *    responses:
 *      '201':
 *        description: Post criado com sucesso.
 */
router.post('/post', protect, async (req: Request, res: Response) => {
    try {
        const result = await handleThreadsPost(req.body);
        res.status(201).json({ message: 'Post criado com sucesso!', ...result });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Erro ao postar no Threads.' });
    }
});

export default router;