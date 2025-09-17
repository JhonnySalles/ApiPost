// src/routes/publishAllRoutes.ts
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
    platforms?: ('tumblr' | 'x' | 'bluesky' | 'threads')[];
}

interface PublishAllPayload {
    platforms: ('tumblr' | 'x' | 'bluesky' | 'threads')[];
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
 *      Inicia um processo em segundo plano para postar conteúdo em várias plataformas.
 *      O cliente deve primeiro conectar-se ao servidor via WebSocket para obter um `socketId`.
 *      A API responde imediatamente com '202 Accepted'. O progresso e o resultado final são enviados através de eventos WebSocket para o `socketId` fornecido.
 *      **Eventos WebSocket Emitidos pelo Servidor:**
 *      1. `progressUpdate`: Enviado para cada plataforma processada.
 *         `{ "type": "progress", "platform": "twitter", "status": "success", "progress": 50 }`
 *      2. `taskCompleted`: Enviado ao final de todo o processo com um sumário.
 *         `{ "type": "summary", "status": "completed", "summary": { ... } }`
 *    security:
 *      - bearerAuth: []
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