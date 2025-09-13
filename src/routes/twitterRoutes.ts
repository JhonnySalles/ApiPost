// src/routes/twitterRoutes.ts
import { Router, Request, Response } from 'express';
import { TwitterApi } from 'twitter-api-v2';
import Logger from '../config/logger';
import * as Sentry from '@sentry/node';
import { protect } from '../middleware/authMiddleware';

const router = Router();

interface TwitterPostOptions {
    text: string;
    images?: string[];
    tags?: string[]; 
}

export async function handleTwitterPost(options: TwitterPostOptions) {
    const { text, images, tags } = options;

    if (!text)
        throw new Error('O texto (text) é obrigatório.');
    
    if (images && images.length > 4)
        throw new Error('É permitido no máximo 4 imagens por tweet.');

    const { TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, TWITTER_REFRESH_TOKEN } = process.env;

    if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET || !TWITTER_REFRESH_TOKEN)
      throw new Error('As credenciais do Twitter não estão configuradas no .env');

    try {
        const client = new TwitterApi({
        clientId: TWITTER_CLIENT_ID,
        clientSecret: TWITTER_CLIENT_SECRET,
        });

        const { client: refreshedClient, accessToken, refreshToken: newRefreshToken } = await client.refreshOAuth2Token(TWITTER_REFRESH_TOKEN);
        const mediaIds: string[] = [];

        if (images && images.length > 0) {
            Logger.info('Fazendo upload de imagens para o Twitter...');
            for (const base64Image of images) {
                const imageBuffer = Buffer.from(base64Image, 'base64');
                const mediaId = await refreshedClient.v1.uploadMedia(imageBuffer, { mimeType: 'image/jpeg', });
                mediaIds.push(mediaId);
            }
            Logger.info(`Upload de ${mediaIds.length} imagem(ns) concluído.`);
        }

        let finalText = text;
        if (tags && tags.length > 0) {
        const hashtags = tags.map(tag => `#${tag}`).join(' ');
        finalText = `${text}\n\n${hashtags}`;
        }

        Logger.info('Enviando o tweet...');
        const tweetResult = await refreshedClient.v2.tweet({
            text: finalText,
            media: mediaIds.length > 0 ? { media_ids: mediaIds as [string] } : undefined,
        });
        
        Logger.info(`Tweet criado com sucesso! ID: ${tweetResult.data.id}`);
        return { success: true, data: tweetResult.data };
    } catch (error) {
        Logger.error('Erro ao postar no Twitter:', error);
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
 *            $ref: '#/components/schemas/SocialPostRequest'
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