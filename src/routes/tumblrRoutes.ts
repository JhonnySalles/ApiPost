// src/routes/tumblrRoutes.ts
import { Router, Request, Response } from 'express';
import tumblr from 'tumblr.js';
import { Readable } from 'stream';
import Logger from '../config/logger';
import * as Sentry from '@sentry/node';
import { protect } from '../middleware/authMiddleware';
import { parseDataUrl } from '../utils/parsing';
import { NpfLayoutBlock } from 'tumblr.js/types/types';

const router = Router();

const tumblrClient = tumblr.createClient({
    consumer_key: process.env.TUMBLR_CONSUMER_KEY,
    consumer_secret: process.env.TUMBLR_CONSUMER_SECRET,
    token: process.env.TUMBLR_ACCESS_TOKEN,
    token_secret: process.env.TUMBLR_ACCESS_TOKEN_SECRET,
});

/**
 * @openapi
 * /tumblr/blogs:
 *  get:
 *    summary: Retorna a lista de blogs do usuário no Tumblr.
 *    tags: [Tumblr]
 *    security:
 *      - bearerAuth: []
 *    responses:
 *      '200':
 *        description: Lista de blogs retornada com sucesso.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                blogs:
 *                  type: array
 *                  items:
 *                    type: object
 *                    properties:
 *                      name:
 *                        type: string
 *                        description: "O identificador do blog, usado nas requisições de postagem."
 *                        example: "meu-blog-principal"
 *                      title:
 *                        type: string
 *                        description: "O título de exibição do blog."
 *                        example: "O Blog Incrível de Testes"
 */
router.get('/blogs', protect, async (req: Request, res: Response) => {
    try {
        const userInfo = await tumblrClient.userInfo();
        const blogs = userInfo.user.blogs.map((blog: any) => ({ name: blog.name, title: blog.title, }));

        Logger.info('Lista de blogs do Tumblr foi solicitada e retornada com sucesso.');
        res.status(200).json({ blogs });
    } catch (error) {
        Logger.error('Erro ao buscar blogs do Tumblr:', error);
        Sentry.captureException(error);
        res.status(500).json({ message: 'Erro ao buscar blogs do Tumblr.' });
    }
});

interface TumblrPostOptions {
    blogName: string;
    text?: string;
    images?: string[];
    tags?: string[];
}

async function sendImagesPhoto(options: TumblrPostOptions) {
    const { blogName, text, images, tags } = options;
    if (images && images.length > 0) {
        const postOptions: any = {
            tags: tags ? tags.join(',') : undefined,
        };

        const contentBlocks: any[] = [];
        if (text)
            contentBlocks.push({ type: 'text', text: text });

        if (images && images.length > 0) {
            Logger.info('Preparando post de FOTO para o Tumblr (método legado)...');
            postOptions.type = 'photo';
            postOptions.caption = text;

            const imageBuffers = images.map((imageDataUrl: string) => {
                const parsedImage = parseDataUrl(imageDataUrl);
                return parsedImage ? Buffer.from(parsedImage.data, 'base64') : null;
            })
                .filter(Boolean);

            postOptions.data = imageBuffers;
        } else if (text) {
            Logger.info('Preparando post de TEXTO para o Tumblr (método legado)...');
            postOptions.type = 'text';
            postOptions.title = tags && tags.length > 0 ? tags[0] : '';
            postOptions.body = text;
        }

        const responseData = await new Promise((resolve, reject) => {
            tumblrClient.createLegacyPost(blogName, postOptions, (err, data) => (err ? reject(err) : resolve(data)));
        });
    }
}

export async function handleTumblrPost(options: TumblrPostOptions) {
    const { blogName, text, images, tags } = options;

    if (!blogName)
        throw new Error('O nome do blog (blogName) é obrigatório para o Tumblr.');

    if (!text && (!images || images.length === 0))
        throw new Error('É necessário fornecer texto ou imagens.');

    try {
        const contentBlocks: any[] = [];

        if (text)
            contentBlocks.push({ type: 'text', text: text });

        if (images && images.length > 0) {
            for (const [index, imageDataUrl] of images.entries()) {
                const parsedImage = parseDataUrl(imageDataUrl);
                if (parsedImage) {
                    const imageBuffer = Buffer.from(parsedImage.data, 'base64');
                    contentBlocks.push({
                        type: 'image',
                        media: imageBuffer,
                        alt_text: text || 'Imagem enviada via apiPost',
                    });
                }
            }
        }

        const responseData = await tumblrClient.createPost(blogName, {
            content: contentBlocks,
            tags: tags,
        });

        Logger.info(`Post criado no Tumblr com sucesso para o blog ${blogName}`);
        return { success: true, data: responseData };
    } catch (error) {
        Logger.error(`Erro ao postar no Tumblr no blog ${blogName}:`, error);
        Sentry.captureException(error, { extra: { blogName } });
        throw error;
    }
}

/**
 * @openapi
 * /tumblr/post:
 *  post:
 *    summary: Cria um novo post em um blog específico do Tumblr.
 *    tags: [Tumblr]
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
 *                  blogName: { type: string }
 *                  text: { type: string }
 *                  images: { type: array, items: { type: base64 } }
 *                  tags: { type: array, items: { type: string } }
 *                required:
 *                  - blogName
 *          example:
 *            blogName: "meu-blog-principal"
 *            text: "Este é um tweet de exemplo!"
 *            tags: ["api", "teste"]
 *            images: ["data:image/png;base64,iVBORw0KGgo..."]
 *    responses:
 *      '201':
 *        description: Post criado com sucesso.
 */
router.post('/post', protect, async (req: Request, res: Response) => {
    try {
        const result = await handleTumblrPost(req.body);
        res.status(201).json({ message: 'Post criado com sucesso!', ...result });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Erro ao postar no Tumblr.' });
    }
});

export default router;