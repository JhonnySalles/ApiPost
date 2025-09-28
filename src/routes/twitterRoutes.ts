import { Router, Request, Response } from 'express';
import { TwitterApi } from 'twitter-api-v2';
import Logger from '../config/logger';
import * as Sentry from '@sentry/node';
import { protect } from '../middleware/authMiddleware';
import { parseDataUrl } from '../utils/parsing';
import { BASE_DOCUMENT, db } from '../services/firebaseService';

const router = Router();

interface TwitterPostOptions {
    text: string;
    images?: string[];
    tags?: string[];
    instanceId?: string;
    postId?: string;
}

export async function handleTwitterPost(options: TwitterPostOptions) {

    const { text, images, tags, instanceId, postId } = options;

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

    const dbRef = (instanceId && postId) ? db.ref(`${BASE_DOCUMENT}/${instanceId}/${postId}`) : null;

    try {
        const client = new TwitterApi({
            appKey: TWITTER_APP_KEY,
            appSecret: TWITTER_APP_SECRET,
            accessToken: TWITTER_ACCESS_TOKEN,
            accessSecret: TWITTER_ACCESS_SECRET,
        });

        const mediaIds: string[] = [];

        if (process.env.IGNORAR_POST)
            Logger.warn(`[Twitter] Ignorado o envio do post.`);
        else if (images && images.length > 0) {
            Logger.info('Fazendo upload de imagens para o Twitter...');
            for (const imageDataUrl of images) {
                const parsedImage = parseDataUrl(imageDataUrl);
                if (!parsedImage) {
                    Logger.warn('[Twitter] Formato de imagem base64 inválido. Pulando imagem.');
                    continue;
                }

                const imageType = parsedImage.mimeType.split('/')[1];
                const imageBuffer = Buffer.from(parsedImage.data, 'base64');
                const mediaId = await client.v1.uploadMedia(imageBuffer, { type: imageType });
                mediaIds.push(mediaId);
            }
            Logger.info(`[Twitter] Upload de ${mediaIds.length} imagem(ns) concluído.`);
        }

        let finalText = text || '';
        if (tags && tags.length > 0) {
            const hashtags = tags.map(tag => `#${tag.replace(/ /g, '')}`).join(' ');
            finalText = finalText ? `${finalText}\n\n${hashtags}` : hashtags;
        }

        const tweetResult = process.env.IGNORAR_POST ? { data: { id: 1 }, message: `[Twitter] Ignorado o envio do post.` } : await client.v2.tweet({
            text: finalText,
            media: mediaIds.length > 0 ? { media_ids: mediaIds as [string] } : undefined,
        });

        if (dbRef)
            await dbRef.update({ twitter: { status: 'success', error: null, } });

        Logger.info(`[Twitter] Tweet criado com sucesso! ID: ${tweetResult.data.id}`);
        return { success: true, data: tweetResult.data };
    } catch (error) {
        Logger.error('[Twitter] Erro ao postar no Twitter: %o', error);
        Sentry.captureException(error);

        if (dbRef)
            await dbRef.update({ twitter: { status: 'error', error: (error && error instanceof Error ? error.message : 'Erro ao postar no Twitter.') } });

        throw error;
    }
}

/**
 * @openapi
 * /twitter/post:
 *  post:
 *    summary: Cria um novo tweet.
 *    tags: [Twitter]
 *    description: |
 *                 Publica um novo tweet na conta do Twitter autenticada. A postagem pode conter texto, até 4 imagens e tags.
 *                 
 *                 **Corpo da Requisição:**
 *                 * **`text`** (string, obrigatório): O conteúdo principal do tweet.
 *                 * **`images`** (array, opcional): Uma lista de até 4 imagens no formato Data URL (base64).
 *                 * **`tags`** (array, opcional): Uma lista de tags que serão convertidas em hashtags e adicionadas ao final do texto.
 *                 * **`instanceId`** (string, opcional): ID da instância do app cliente para rastreamento no Firebase.
 *                 * **`postId`** (string, opcional): ID do post gerado pelo app cliente para rastreamento no Firebase.
 *                 
 *                 **Corpo da Resposta:**
 *                 * Retorna um objeto com os dados do tweet criado com sucesso (status `201 Created`).
 *                 * Retorna um erro `400 Bad Request` se os dados forem inválidos (ex: mais de 4 imagens).
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
 *      '201':
 *        description: Tweet criado com sucesso.
 */
router.post('/post', protect, async (req: Request, res: Response) => {
    const { instanceId, postId } = req.body;
    const dbRef = (instanceId && postId) ? db.ref(`${BASE_DOCUMENT}/${instanceId}/${postId}`) : null;

    try {
        const result = await handleTwitterPost(req.body);

        if (dbRef)
            await dbRef.update({ twitter: { status: 'success', error: null, } });

        res.status(201).json({ message: 'Tweet criado com sucesso!', ...result });
    } catch (error: any) {
        if (dbRef)
            await dbRef.update({ twitter: { status: 'error', error: error.message || 'Erro ao postar no Twitter.' } });

        res.status(500).json({ message: error.message || 'Erro ao postar no Twitter.' });
    }
});

export default router;