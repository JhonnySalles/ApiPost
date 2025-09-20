import { Router, Request, Response } from 'express';
import { BskyAgent, RichText } from '@atproto/api';
import Logger from '../config/logger';
import * as Sentry from '@sentry/node';
import { protect } from '../middleware/authMiddleware';
import { parseDataUrl } from '../utils/parsing';
import sharp from 'sharp';

const router = Router();

const agent = new BskyAgent({
    service: 'https://bsky.social',
});

const BLUESKY_MAX_IMAGE_SIZE_BYTES = 976 * 1024;

async function ensureAuthenticatedAgent() {
    if (!agent.hasSession) {
        Logger.info('[Bluesky] Sessão do Bluesky não encontrada. Realizando login...');
        const { BLUESKY_HANDLE, BLUESKY_APP_PASSWORD } = process.env;

        if (!BLUESKY_HANDLE || !BLUESKY_APP_PASSWORD)
            throw new Error('As credenciais do Bluesky não estão configuradas no .env');

        await agent.login({
            identifier: BLUESKY_HANDLE,
            password: BLUESKY_APP_PASSWORD,
        });
        Logger.info('[Bluesky] Login no Bluesky realizado com sucesso.');
    }
}

interface BlueskyPostOptions {
    text: string;
    images?: string[];
    tags?: string[];
}

export async function handleBlueskyPost(options: BlueskyPostOptions) {
    const { text, images, tags } = options;

    if (!text && (!images || images.length === 0))
        throw new Error('Bluesky: É necessário fornecer texto ou imagens.');

    if (images && images.length > 4)
        throw new Error('Bluesky: É permitido no máximo 4 imagens por post no Bluesky.');

    try {
        await ensureAuthenticatedAgent();

        let finalText = text || '';
        if (tags && tags.length > 0) {
            const hashtags = tags.map(tag => `#${tag.replace(/ /g, '')}`).join(' ');
            finalText = finalText ? `${finalText}\n\n${hashtags}` : hashtags;
        }

        const postEmbeds = [];

        if (images && images.length > 0) {
            Logger.info('[Bluesky] Fazendo upload de imagens para o Bluesky, com otimização...');
            for (const imageDataUrl of images) {
                const parsedImage = parseDataUrl(imageDataUrl);
                if (!parsedImage) {
                    Logger.info('[Bluesky] Formato de imagem base64 inválido (Data URL esperado). Pulando imagem.');
                    continue;
                }

                let imageBuffer: Buffer<ArrayBufferLike> = Buffer.from(parsedImage.data, 'base64');

                if (imageBuffer.length > BLUESKY_MAX_IMAGE_SIZE_BYTES) {
                    Logger.info(`[Bluesky] Imagem muito grande (${(imageBuffer.length / 1024).toFixed(2)}KB). Otimizando...`);

                    imageBuffer = await sharp(imageBuffer)
                        .resize(1080, null, { withoutEnlargement: true })
                        .jpeg({ quality: 80, progressive: true, force: false })
                        .png({ quality: 80, force: false })
                        .webp({ quality: 80, force: false })
                        .toBuffer();

                    Logger.info(`[Bluesky] Imagem otimizada para ${(imageBuffer.length / 1024).toFixed(2)}KB.`);
                }

                const uploadedImage = await agent.uploadBlob(imageBuffer, {
                    encoding: parsedImage.mimeType,
                });
                postEmbeds.push({ image: uploadedImage.data.blob, alt: '' });
            }
            Logger.info(`[Bluesky] Upload de ${postEmbeds.length} imagem(ns) concluído.`);
        }

        const richText = new RichText({ text: finalText });
        await richText.detectFacets(agent);

        const postPayload: any = {
            text: richText.text,
            facets: richText.facets,
            createdAt: new Date().toISOString(),
        };

        if (postEmbeds.length > 0) {
            postPayload.embed = {
                $type: 'app.bsky.embed.images',
                images: postEmbeds,
            };
        }

        Logger.info('[Bluesky] Enviando o post para o Bluesky...');
        const postResult = await agent.post(postPayload);
        return { success: true, data: postResult };
    } catch (error) {
        Logger.error('[Bluesky] Erro ao postar no Bluesky: %o', error);
        Sentry.captureException(error);
        throw error;
    }
}

/**
 * @openapi
 * /bluesky/post:
 *  post:
 *    summary: Cria um novo post (skeet) no Bluesky.
 *    tags: [Bluesky]
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
        const result = await handleBlueskyPost(req.body);
        res.status(201).json({ message: 'Post criado com sucesso!', ...result });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Erro ao postar no Bluesky.' });
    }
});

export default router;