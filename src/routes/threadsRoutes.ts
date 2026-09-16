import { Router, Request, Response } from 'express';
import { protect } from '../middleware/authMiddleware';
import { ValidationError } from '../errors/ValidationError';
import { threadsQueue, ThreadsPostOptions } from '../services/ThreadsQueueManager';

const router = Router();

export async function handleThreadsPost(options: ThreadsPostOptions) {
    const job = threadsQueue.enqueue(options);
    return { success: true, scheduled: true, data: { jobId: job.id, status: job.status } };
}

/**
 * @openapi
 * /threads/post:
 *  post:
 *    summary: Cria/enfileira um novo post no Threads.
 *    tags: [Threads]
 *    description: |
 *                 Enfileira um novo post no Threads para envio assíncrono em segundo plano.
 *                 A fila gerencia a criação de contêineres, verificação de processamento e retries com backoff exponencial.
 *                 
 *                 **Corpo da Requisição:**
 *                 * **`text`** (string, opcional): O conteúdo do post, que servirá como legenda para posts com imagem/carrossel.
 *                 * **`images`** (array, opcional): Uma lista de imagens no formato Data URL (base64).
 *                 * **`tags`** (array, opcional): Apenas a primeira tag será usada como topic_tag.
 *                 * **`instanceId`** (string, opcional): ID da instância do app cliente para rastreamento no Firebase.
 *                 * **`postId`** (string, opcional): ID do post gerado pelo app cliente para rastreamento no Firebase.
 *                 
 *                 **Corpo da Resposta:**
 *                 * Retorna status `202 Accepted` com `jobId` e `status: 'queued'`.
 *                 * O status do processamento pode ser consultado via `GET /threads/status/{jobId}`.
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
 *      '202':
 *        description: Post enfileirado com sucesso para processamento em background.
 */
router.post('/post', protect, async (req: Request, res: Response) => {
    try {
        const result = await handleThreadsPost(req.body);
        res.status(202).json({ message: 'Post enfileirado com sucesso!', ...result });
    } catch (error: any) {
        const status = error instanceof ValidationError ? 400 : 500;
        res.status(status).json({ message: error.message || 'Erro ao enfileirar post no Threads.' });
    }
});

/**
 * @openapi
 * /threads/status/{jobId}:
 *  get:
 *    summary: Consulta o status de processamento de um post no Threads.
 *    tags: [Threads]
 *    parameters:
 *      - in: path
 *        name: jobId
 *        required: true
 *        schema:
 *          type: string
 *        description: ID do job retornado no endpoint /threads/post.
 *    responses:
 *      '200':
 *        description: Status atual do job.
 *      '404':
 *        description: Job não encontrado ou expirado.
 */
router.get('/status/:jobId', protect, (req: Request, res: Response) => {
    const { jobId } = req.params;
    const job = threadsQueue.getJob(jobId);

    if (!job) {
        return res.status(404).json({ message: `Job ${jobId} não encontrado ou expirado da memória.` });
    }

    res.status(200).json({
        jobId: job.id,
        status: job.status,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
    });
});

/**
 * @openapi
 * /threads/queue/status:
 *  get:
 *    summary: Consulta o status da fila de envio do Threads.
 *    tags: [Threads]
 *    responses:
 *      '200':
 *        description: Informações gerais da fila.
 */
router.get('/queue/status', protect, (_req: Request, res: Response) => {
    const queueStatus = threadsQueue.getQueueStatus();
    res.status(200).json(queueStatus);
});

export default router;