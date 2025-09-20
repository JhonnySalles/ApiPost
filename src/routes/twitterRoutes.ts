import { Router, Request, Response } from 'express';
import { TwitterApi } from 'twitter-api-v2';
import Logger from '../config/logger';
import * as Sentry from '@sentry/node';
import { protect } from '../middleware/authMiddleware';
import { parseDataUrl } from '../utils/parsing';

const router = Router();

interface TwitterPostOptions {
    text: string;
    images?: string[];
    tags?: string[];
}

export async function handleTwitterPost(options: TwitterPostOptions) {

    const { text, images, tags } = options;

    if (!text && (!images || images.length === 0))
        throw new Error('Twitter: É necessário fornecer texto ou imagens.');

    if (images && images.length > 4)
        throw new Error('Twitter: É permitido no máximo 4 imagens por tweet.');

    const {
        TWITTER_APP_KEY,
        TWITTER_APP_SECRET,
        TWITTER_ACCESS_TOKEN,
        TWITTER_ACCESS_SECRET,
    } = process.env;

    if (!TWITTER_APP_KEY || !TWITTER_APP_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_SECRET)
        throw new Error('Twitter: As 4 chaves do Twitter (OAuth 1.0a) não estão configuradas no .env');

    try {
        const client = new TwitterApi({
            appKey: TWITTER_APP_KEY,
            appSecret: TWITTER_APP_SECRET,
            accessToken: TWITTER_ACCESS_TOKEN,
            accessSecret: TWITTER_ACCESS_SECRET,
        });

        const mediaIds: string[] = [];

        if (images && images.length > 0) {
            Logger.info('Fazendo upload de imagens para o Twitter...');
            for (const imageDataUrl of images) {
                const parsedImage = parseDataUrl(imageDataUrl);
                if (!parsedImage) {
                    Logger.warn('Formato de imagem base64 inválido. Pulando imagem.');
                    continue;
                }

                const imageType = parsedImage.mimeType.split('/')[1];
                const imageBuffer = Buffer.from(parsedImage.data, 'base64');
                const mediaId = await client.v1.uploadMedia(imageBuffer, { type: imageType });
                mediaIds.push(mediaId);
            }
            Logger.info(`Upload de ${mediaIds.length} imagem(ns) concluído.`);
        }

        let finalText = text || '';
        if (tags && tags.length > 0) {
            const hashtags = tags.map(tag => `#${tag.replace(/ /g, '')}`).join(' ');
            finalText = finalText ? `${finalText}\n\n${hashtags}` : hashtags;
        }

        Logger.info('Enviando o tweet...');
        const tweetResult = await client.v2.tweet({
            text: finalText,
            media: mediaIds.length > 0 ? { media_ids: mediaIds as [string] } : undefined,
        });

        Logger.info(`Tweet criado com sucesso! ID: ${tweetResult.data.id}`);
        return { success: true, data: tweetResult.data };
    } catch (error) {
        Logger.error('Erro ao postar no Twitter: %o', error);
        Sentry.captureException(error);
        throw error;
    }
}

/**
 * @openapi
 * /twitter/post:
 *  post:
 *    summary: Cria um novo tweet.
 *    tags: [Twitter]
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
 *        description: Tweet criado com sucesso.
 */
router.post('/post', protect, async (req: Request, res: Response) => {
    try {
        const result = await handleTwitterPost(req.body);
        res.status(201).json({ message: 'Tweet criado com sucesso!', ...result });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Erro ao postar no Twitter.' });
    }
});

export default router;