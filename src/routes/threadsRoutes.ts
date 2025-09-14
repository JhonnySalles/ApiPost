// src/routes/threadsRoutes.ts
import { Router, Request, Response } from 'express';
import { ThreadsAPI } from 'threads-api';
import Logger from '../config/logger';
import * as Sentry from '@sentry/node';
import { protect } from '../middleware/authMiddleware';
import { parseDataUrl } from '../utils/parsing';

const router = Router();

let threadsAPI: ThreadsAPI | undefined;

async function getAuthenticatedClient(): Promise<ThreadsAPI> {
    if (!threadsAPI) {
        Logger.info('Cliente do Threads não encontrado. Inicializando e realizando login...');
        const { THREADS_USERNAME, THREADS_PASSWORD } = process.env;

        if (!THREADS_USERNAME || !THREADS_PASSWORD)
            throw new Error('As credenciais do Threads não estão configuradas no .env');

        threadsAPI = new ThreadsAPI({
            username: THREADS_USERNAME,
            password: THREADS_PASSWORD,
        });

        await threadsAPI.getUserIDfromUsername(THREADS_USERNAME);
        Logger.info('Login no Threads realizado com sucesso.');
    }
    return threadsAPI;
}

interface ThreadsPostOptions {
    text?: string;
    images?: string[];
    tags?: string[];
}

export async function handleThreadsPost(options: ThreadsPostOptions) {
    const { text, images, tags } = options;

    if (!text && (!images || images.length === 0))
        throw new Error('É necessário fornecer texto ou imagens.');

    try {
        const client = await getAuthenticatedClient();
        let finalText = text || '';
        if (tags && tags.length > 0)
            finalText = `${text}\n\n#${tags[0]}`;

        const publishOptions: { text: string; attachment?: any } = { text: finalText };

        if (images && images.length > 0) {
            Logger.info('Processando imagens para o Threads...');
            const imageAttachments = images.map((imageDataUrl: string) => {
                const parsedImage = parseDataUrl(imageDataUrl);
                if (!parsedImage) {
                    Logger.warn('Formato de imagem base64 inválido. Pulando imagem.');
                    return null;
                }
                const extension = parsedImage.mimeType.split('/')[1] || 'jpg';
                return {
                    type: `.${extension}`,
                    data: Buffer.from(parsedImage.data, 'base64'),
                };
            }).filter(Boolean);

            if (imageAttachments.length === 1)
                publishOptions.attachment = { image: imageAttachments[0] };
            else if (imageAttachments.length > 1)
                publishOptions.attachment = { sidecar: imageAttachments };
        }

        Logger.info('Enviando o post para o Threads...');
        const postID = await client.publish(publishOptions);

        Logger.info(`Post criado com sucesso no Threads! ID: ${postID}`);
        return { success: true, data: { postID } };
    } catch (error) {
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