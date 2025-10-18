import { Router, Request, Response } from 'express';
import tumblr from 'tumblr.js';
import Logger from '../config/logger';
import * as Sentry from '@sentry/node';
import { protect } from '../middleware/authMiddleware';
import { parseDataUrl } from '../utils/parsing';
import { BASE_DOCUMENT, db } from '../services/firebaseService';

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
 *    description: |
 *                 Recupera a lista de blogs associados à conta do Tumblr autenticada na API. O retorno inclui o nome de exibição (título) e o identificador único de cada blog. O identificador (`name`) é o valor que deve ser usado no parâmetro `blogName` ao criar um novo post.
 *                
 *                 **Corpo da Resposta:**
 *                 * Retorna um objeto contendo um array de blogs, onde cada objeto possui as chaves `name` e `title` (status `200 OK`).
 *                 * Retorna um erro `500 Internal Server Error` se houver uma falha na comunicação com a API do Tumblr.
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
        Logger.error('Erro ao buscar blogs do Tumblr: %o', error);
        Sentry.captureException(error);
        res.status(500).json({ message: 'Erro ao buscar blogs do Tumblr.' });
    }
});

interface TumblrPostOptions {
    blogName: string;
    text?: string;
    images?: string[];
    tags?: string[];
    instanceId?: string;
    postId?: string;
}

export async function handleTumblrPost(options: TumblrPostOptions) {
    const { blogName, text, images, tags, instanceId, postId } = options;

    if (!blogName)
        throw new Error(`Tumblr: O nome do blog (blogName) é obrigatório para o Tumblr.`);

    if (!text && (!images || images.length === 0))
        throw new Error(`Tumblr: É necessário fornecer texto ou imagens.`);

    const dbRef = (instanceId && postId) ? db.ref(`${BASE_DOCUMENT}/${instanceId}/${postId}`) : null;

    const contentBlocks: any[] = [];
    if (text)
        contentBlocks.push({ type: 'text', text: text });

    if (images && images.length > 0) {
        for (const imageDataUrl of images) {
            const parsedImage = parseDataUrl(imageDataUrl);
            if (parsedImage) {
                const imageBuffer = Buffer.from(parsedImage.data, 'base64');
                contentBlocks.push({
                    type: 'image',
                    media: imageBuffer,
                });
            }
        }
    }

    const filteredTags = tags?.filter(tag => tag && tag.trim() !== '');

    try {
        if (process.env.IGNORAR_POST) {
            Logger.warn(`[Tumblr] Ignorado o envio do post.`);
            await new Promise(resolve => setTimeout(resolve, (Math.floor(Math.random() * 5) + 1) * 1000));

            if (Math.random() < 0.3) {
                Logger.warn(`[Tumblr] Simulando uma falha (30% de chance).`);
                throw new Error('Teste de excessão');
            }
        }

        const responseData = process.env.IGNORAR_POST ? { message: `[Tumblr] Ignorado o envio do post.` } : await tumblrClient.createPost(blogName, {
            content: contentBlocks,
            tags: filteredTags,
        });

        if (dbRef)
            await dbRef.update({ tumblr: { status: 'success', error: null, } });

        Logger.info(`[Tumblr] Post criado no Tumblr com sucesso para o blog ${blogName}`);
        return { success: true, data: responseData };
    } catch (error: any) {
        if (error && error.statusCode === 403) {
            Logger.warn(`[Tumblr] Limite de postagem diária atingido para o blog ${blogName}. Tentando salvar como rascunho agendado.`);

            const publishDate = new Date();
            publishDate.setHours(publishDate.getHours() + 24);

            try {
                const responseData = await tumblrClient.createPost(blogName, {
                    content: contentBlocks,
                    tags: filteredTags,
                    state: 'queue',
                    publish_on: publishDate.toISOString(),
                });

                if (dbRef)
                    await dbRef.update({ tumblr: { status: 'scheduled', error: null, publishTime: publishDate.toISOString() } });

                Logger.info(`[Tumblr] Post salvo como rascunho e agendado para ${publishDate.toISOString()} no blog ${blogName}`);
                return { success: true, data: responseData, scheduled: true, publishTime: publishDate.toISOString() };
            } catch (draftError: any) {
                Logger.error(`[Tumblr] Falha ao salvar o rascunho agendado no blog ${blogName}: %o`, draftError);
                Sentry.captureException(draftError, { extra: { blogName, originalError: error } });

                if (dbRef)
                    await dbRef.update({ tumblr: { status: 'error', error: (draftError && draftError.message) ? draftError.message : 'Erro ao salvar rascunho no Tumblr.' } });

                throw draftError;
            }
        } else {
            Logger.error(`[Tumblr] Erro ao postar no Tumblr no blog ${blogName}: %o`, error);
            Sentry.captureException(error, { extra: { blogName } });

            if (dbRef)
                await dbRef.update({ tumblr: { status: 'error', error: (error && error.message) ? error.message : 'Erro ao postar no Tumblr.' } });
        }

        throw error;
    }
}

/**
 * @openapi
 * /tumblr/post:
 *  post:
 *    summary: Cria um novo post em um blog específico do Tumblr.
 *    tags: [Tumblr]
 *    description: |
 *                 Cria um novo post em um blog específico do Tumblr. A postagem pode ser de texto ou um photoset com múltiplas imagens.
 *                 
 *                 **Corpo da Requisição:**
 *                 * **`blogName`** (string, obrigatório): O identificador do blog do Tumblr onde o post será publicado (ex: "meu-blog-principal").
 *                 * **`text`** (string, opcional): O corpo do texto ou a legenda para o post de imagem.
 *                 * **`images`** (array, opcional): Uma lista de imagens no formato Data URL (base64) para criar um photoset.
 *                 * **`tags`** (array, opcional): Uma lista de tags para associar ao post.
 *                 * **`instanceId`** (string, opcional): ID da instância do app cliente para rastreamento no Firebase.
 *                 * **`postId`** (string, opcional): ID do post gerado pelo app cliente para rastreamento no Firebase.
 *                 
 *                 **Corpo da Resposta:**
 *                 * Retorna um objeto com os dados do post criado com sucesso (status `201 Created`).
 *                 * Retorna um erro `400 Bad Request` se o `blogName` não for fornecido ou se a API do Tumblr rejeitar a formatação.
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
 *                  instanceId: { type: string }
 *                  postId: { type: string }
 *                required:
 *                  - blogName
 *          example:
 *            blogName: "meu-blog-principal"
 *            text: "Este é um tweet de exemplo!"
 *            tags: ["api", "teste"]
 *            images: ["data:image/png;base64,iVBORw0KGgo..."]
 *            instanceId: "asdffasdfFMaxwBvUw49LOjc2"
 *            postId: "153"
 *    responses:
 *      '200':
 *        description: Post criado com sucesso.
 *      '201':
 *        description: Rascunho agendado com sucesso.
 */
router.post('/post', protect, async (req: Request, res: Response) => {
    try {
        const result = await handleTumblrPost(req.body);
        const status = result.scheduled ? 201 : 200;
        res.status(status).json({ message: 'Post criado com sucesso!', ...result });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Erro ao postar no Tumblr.' });
    }
});

export default router;