import crypto from 'crypto';
import Logger from '../config/logger';
import * as Sentry from '@sentry/node';
import { ThreadsApiError, ThreadsAuthenticatedApiClient } from '@libs/threads-graph-api/index.js';
import { uploadImage } from './cloudinaryService';
import { BASE_DOCUMENT, db } from './firebaseService';
import { toTitleCase } from '../utils/texts';
import { ValidationError } from '../errors/ValidationError';
import { withRetry, sleep } from '../utils/retryEngine';
import { classifyThreadsError } from '../utils/threadsErrorClassifier';

export interface ThreadsPostOptions {
    text?: string;
    images?: string[];
    urls?: string[];
    tags?: string[];
    instanceId?: string;
    postId?: string;
    socketId?: string;
}

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface ThreadsJob {
    id: string;
    status: JobStatus;
    options: ThreadsPostOptions;
    attempts: number;
    maxAttempts: number;
    createdAt: Date;
    updatedAt: Date;
    result?: { postId: string };
    error?: string;
}

class ThreadsQueueManager {
    private queue: ThreadsJob[] = [];
    private jobsMap: Map<string, ThreadsJob> = new Map();
    private isProcessing = false;
    private readonly MAX_ATTEMPTS = 3;
    private readonly RETENTION_TIME_MS = 60 * 60 * 1000; // 1 hora de retenção em memória

    constructor() {
        // Limpeza periódica de jobs antigos a cada 15 minutos
        setInterval(() => this.cleanupOldJobs(), 15 * 60 * 1000).unref();
    }

    public enqueue(options: ThreadsPostOptions): ThreadsJob {
        const { text, images, urls, instanceId, postId } = options;
        const hasText = text && text.trim().length > 0;
        const hasImages = (images && images.length > 0) || (urls && urls.length > 0);

        if (!hasText && !hasImages) {
            throw new ValidationError('Threads: É necessário fornecer texto ou imagens para o Threads.');
        }

        const job: ThreadsJob = {
            id: crypto.randomUUID(),
            status: 'queued',
            options,
            attempts: 0,
            maxAttempts: this.MAX_ATTEMPTS,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.jobsMap.set(job.id, job);
        this.queue.push(job);

        // Registra status inicial queued com o jobId no Firebase se instanceId e postId forem informados
        if (instanceId && postId && db) {
            db.ref(`${BASE_DOCUMENT}/${instanceId}/${postId}/threads`).update({
                status: 'queued',
                jobId: job.id,
                error: null,
                updatedAt: new Date().toISOString(),
            }).catch(dbErr => {
                Logger.error('[ThreadsQueue] Falha ao registrar status queued no Firebase:', dbErr);
            });
        }

        Logger.info(`[ThreadsQueue] Job ${job.id} enfileirado com sucesso. Posição na fila: ${this.queue.length}`);

        // Inicia o processamento assíncrono no próximo tick para não travar o ciclo de resposta
        setImmediate(() => this.processNext());

        return job;
    }

    public getJob(jobId: string): ThreadsJob | undefined {
        return this.jobsMap.get(jobId);
    }

    public getQueueStatus() {
        return {
            queuedCount: this.queue.length,
            isProcessing: this.isProcessing,
            totalTracked: this.jobsMap.size,
        };
    }

    private cleanupOldJobs(): void {
        const now = Date.now();
        for (const [id, job] of this.jobsMap.entries()) {
            if (
                (job.status === 'completed' || job.status === 'failed') &&
                now - job.updatedAt.getTime() > this.RETENTION_TIME_MS
            ) {
                this.jobsMap.delete(id);
            }
        }
    }

    private async processNext(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const job = this.queue.shift();

        if (!job) {
            this.isProcessing = false;
            return;
        }

        job.status = 'processing';
        job.updatedAt = new Date();
        Logger.info(`[ThreadsQueue] Iniciando processamento do Job ${job.id}...`);

        const { instanceId, postId } = job.options;
        if (instanceId && postId && db) {
            db.ref(`${BASE_DOCUMENT}/${instanceId}/${postId}/threads`).update({
                status: 'processing',
                jobId: job.id,
                updatedAt: new Date().toISOString(),
            }).catch(dbErr => {
                Logger.warn('[ThreadsQueue] Falha ao atualizar status para processing no Firebase:', dbErr);
            });
        }

        try {
            const result = await this.executeJobWithRetry(job);
            job.status = 'completed';
            job.result = result;
            job.updatedAt = new Date();
            Logger.info(`[ThreadsQueue] Job ${job.id} concluído com sucesso! Post ID: ${result.postId}`);
        } catch (error: any) {
            job.status = 'failed';
            job.error = error?.message || 'Erro desconhecido ao processar post no Threads.';
            job.updatedAt = new Date();
            Logger.error(`[ThreadsQueue] Job ${job.id} falhou definitivamente após ${job.attempts} tentativas: ${job.error}`);
        } finally {
            this.isProcessing = false;
            // Processa o próximo da fila
            setImmediate(() => this.processNext());
        }
    }

    private async executeJobWithRetry(job: ThreadsJob): Promise<{ postId: string }> {
        const { instanceId, postId } = job.options;
        const dbRef = (instanceId && postId && db) ? db.ref(`${BASE_DOCUMENT}/${instanceId}/${postId}`) : null;

        return withRetry(
            async () => {
                job.attempts++;
                job.updatedAt = new Date();
                return await this.publishPost(job);
            },
            {
                maxAttempts: this.MAX_ATTEMPTS,
                initialDelayMs: 2000,
                backoffFactor: 2,
                jitter: true,
                isRetryable: (err) => {
                    const classification = classifyThreadsError(err);
                    return classification.isRetryable;
                },
                onRetry: (attempt, delayMs, err) => {
                    const classification = classifyThreadsError(err);
                    Logger.warn(
                        `[ThreadsQueue] Tentativa ${attempt}/${this.MAX_ATTEMPTS} para o Job ${job.id} falhou (${classification.errorMessage}). Aguardando ${delayMs}ms antes de retentar...`
                    );
                },
            }
        ).then(async (result) => {
            if (dbRef) {
                await dbRef.child('threads').update({
                    status: 'success',
                    jobId: job.id,
                    error: null,
                    postId: result.postId,
                    updatedAt: new Date().toISOString(),
                });

                // Atualiza o _summary para refletir o sucesso do Threads
                try {
                    const summaryRef = dbRef.child('_summary');
                    const snap = await summaryRef.once('value');
                    const summary = snap.val() || {
                        startedAt: new Date(job.createdAt).toISOString(),
                        total: 1,
                        platforms: ['threads'],
                    };
                    const successful: string[] = Array.isArray(summary.successful) ? summary.successful : [];
                    const failed: any[] = Array.isArray(summary.failed) ? summary.failed : [];
                    const scheduled: any[] = Array.isArray(summary.scheduled) ? summary.scheduled : [];

                    if (!successful.includes('threads')) {
                        successful.push('threads');
                    }
                    const updatedScheduled = scheduled.filter(p => typeof p === 'object' ? p.platform !== 'threads' : p !== 'threads');
                    const updatedFailed = failed.filter(item => typeof item === 'object' ? item.platform !== 'threads' : item !== 'threads');

                    await summaryRef.update({
                        ...summary,
                        successful,
                        scheduled: updatedScheduled,
                        failed: updatedFailed,
                        status: updatedFailed.length === 0 ? 'completed' : 'completed_with_errors',
                        completedAt: new Date().toISOString(),
                    });
                } catch (summaryErr) {
                    Logger.error('[ThreadsQueue] Erro ao sincronizar _summary no Firebase após sucesso:', summaryErr);
                }
            }
            return result;
        }).catch(async (finalError) => {
            const errorMsg = finalError instanceof Error ? finalError.message : String(finalError);

            if (dbRef) {
                await dbRef.child('threads').update({
                    status: 'error',
                    jobId: job.id,
                    error: errorMsg || 'Erro ao postar no Threads.',
                    updatedAt: new Date().toISOString(),
                });

                // Atualiza o _summary para remover Threads dos sucessos e colocar nas falhas
                try {
                    const summaryRef = dbRef.child('_summary');
                    const snap = await summaryRef.once('value');
                    const summary = snap.val() || {
                        startedAt: new Date(job.createdAt).toISOString(),
                        total: 1,
                        platforms: ['threads'],
                    };
                    const successful: string[] = Array.isArray(summary.successful) ? summary.successful : [];
                    const failed: any[] = Array.isArray(summary.failed) ? summary.failed : [];
                    const scheduled: any[] = Array.isArray(summary.scheduled) ? summary.scheduled : [];

                    const updatedSuccessful = successful.filter(p => p !== 'threads');
                    const updatedScheduled = scheduled.filter(p => typeof p === 'object' ? p.platform !== 'threads' : p !== 'threads');
                    const existingFailedIndex = failed.findIndex(item => typeof item === 'object' && item.platform === 'threads');
                    const failedEntry = { platform: 'threads', reason: errorMsg || 'Erro ao postar no Threads.' };

                    if (existingFailedIndex >= 0) {
                        failed[existingFailedIndex] = failedEntry;
                    } else {
                        failed.push(failedEntry);
                    }

                    await summaryRef.update({
                        ...summary,
                        successful: updatedSuccessful,
                        scheduled: updatedScheduled,
                        failed,
                        status: updatedSuccessful.length === 0 ? 'failed' : 'completed_with_errors',
                        completedAt: new Date().toISOString(),
                    });
                } catch (summaryErr) {
                    Logger.error('[ThreadsQueue] Erro ao sincronizar _summary no Firebase após erro:', summaryErr);
                }
            }

            // Registrar erro no Firebase post_errors e Sentry
            try {
                if (db) {
                    const errorLogRef = db.ref('post_errors');
                    await errorLogRef.push({
                        timestamp: new Date().toISOString(),
                        platform: 'threads',
                        errorMessage: errorMsg,
                        fullError: JSON.parse(JSON.stringify(finalError, Object.getOwnPropertyNames(finalError))),
                        postId: postId || null,
                        jobId: job.id,
                        attempts: job.attempts,
                    });
                }
            } catch (dbError) {
                Logger.error('[Firebase] Falha ao gravar log de erro no Firebase:', dbError);
                Sentry.captureException(dbError);
            }

            Sentry.captureException(finalError, {
                extra: {
                    jobId: job.id,
                    postId: postId,
                    attempts: job.attempts,
                },
            });

            throw finalError;
        });
    }

    private async pollContainerUntilReady(client: ThreadsAuthenticatedApiClient, containerId: string, maxPollSeconds = 45): Promise<void> {
        const startTime = Date.now();
        const pollIntervalMs = 2500;

        while (Date.now() - startTime < maxPollSeconds * 1000) {
            try {
                const mediaObj = await client.getMediaObject({
                    id: containerId,
                    fields: ['id', 'status', 'error_message'],
                });

                const containerStatus = mediaObj.status || mediaObj.status_code;
                Logger.info(`[ThreadsQueue] Polling contêiner ${containerId}: status = ${containerStatus}`);

                if (containerStatus === 'FINISHED' || containerStatus === 'PUBLISHED') {
                    Logger.info(`[ThreadsQueue] ✅ Contêiner ${containerId} está pronto (${containerStatus}).`);
                    return;
                }

                if (containerStatus === 'ERROR' || containerStatus === 'EXPIRED') {
                    const errorDetail = mediaObj.error_message ? `: ${mediaObj.error_message}` : '';
                    throw new Error(`Contêiner ${containerId} falhou com status ${containerStatus}${errorDetail}`);
                }
            } catch (err: any) {
                if (err instanceof ThreadsApiError) {
                    const classified = classifyThreadsError(err);
                    if (!classified.isRetryable) {
                        throw err;
                    }
                    Logger.warn(`[ThreadsQueue] Aviso transitório ao consultar contêiner ${containerId}: ${err.message}. Retentando polling...`);
                } else if (err.message && err.message.includes('falhou com status')) {
                    throw err;
                } else {
                    Logger.warn(`[ThreadsQueue] Erro ao consultar status do contêiner ${containerId}: ${err?.message || err}. Retentando...`);
                }
            }

            await sleep(pollIntervalMs);
        }

        Logger.warn(`[ThreadsQueue] Timeout de ${maxPollSeconds}s atingido ao aguardar contêiner ${containerId}. Prosseguindo...`);
    }

    private async publishPost(job: ThreadsJob): Promise<{ postId: string }> {
        const { text, images, urls, tags } = job.options;
        const hasImages = (images && images.length > 0) || (urls && urls.length > 0);

        const { THREADS_ACCESS_TOKEN, THREADS_USER_ID } = process.env;
        if (!THREADS_ACCESS_TOKEN || !THREADS_USER_ID) {
            throw new ValidationError('Threads: Credenciais da Threads Graph API não configuradas no .env');
        }

        // Mock para ambiente de teste / ignorar post
        if (process.env.IGNORAR_POST) {
            if (process.env.NODE_ENV !== 'test') {
                Logger.warn(`[Threads] Ignorado o envio do post.`);
            }

            await sleep((Math.floor(Math.random() * 2) + 1) * 2000);

            if (process.env.NODE_ENV === 'test' && process.env.TEST_ERROR) {
                throw new Error('Teste de excessão');
            } else if (process.env.NODE_ENV !== 'test' && Math.random() < 0.3) {
                Logger.warn(`[Threads] Simulando uma falha.`);
                throw new Error('Teste de excessão');
            }

            return { postId: '[Threads] Ignorado o envio do post.' };
        }

        const client = new ThreadsAuthenticatedApiClient(THREADS_ACCESS_TOKEN, THREADS_USER_ID);

        let topicTag: string | undefined = undefined;
        if (tags && tags.length > 0) {
            const firstTag = tags.find(tag => tag && tag.trim() !== '');
            if (firstTag) {
                let processedTag = toTitleCase(firstTag).replace(/[\s-]/g, '');
                processedTag = processedTag.replace(/[.&@!?,;:]/g, '');
                const isNumeric = processedTag.trim() && !isNaN(Number(processedTag));
                if (processedTag.trim() && !isNumeric) {
                    topicTag = processedTag.length > 50 ? processedTag.substring(0, 50) : processedTag;
                }
            }
        }

        let creationId: string;

        if (!hasImages) {
            Logger.info('[ThreadsQueue] Criando post de texto...');
            const response = await client.createMediaContainer({
                mediaType: 'TEXT',
                text: (text || '').replace('\t', ''),
                topicTag: topicTag,
            });
            creationId = response.id;
        } else {
            let imageUrls: string[] = urls || [];

            if (imageUrls.length === 0 && images && images.length > 0) {
                Logger.info(`[ThreadsQueue] Fazendo upload de ${images.length} imagem(ns) para o Cloudinary...`);
                imageUrls = await Promise.all(images.map(base64 => uploadImage(base64)));
            }

            if (imageUrls.length === 1) {
                Logger.info('[ThreadsQueue] Criando post de imagem única...');
                const response = await client.createMediaContainer({
                    mediaType: 'IMAGE',
                    text: text ? text.replace('\t', '') : undefined,
                    imageUrl: imageUrls[0],
                    topicTag: topicTag,
                });
                creationId = response.id;

                // Aguarda o contêiner de imagem ficar pronto
                await this.pollContainerUntilReady(client, creationId, 45);
            } else {
                Logger.info('[ThreadsQueue] Criando contêineres de itens para o carrossel sequencialmente...');
                const itemContainerIds: string[] = [];

                for (let i = 0; i < imageUrls.length; i++) {
                    const url = imageUrls[i];
                    Logger.info(`[ThreadsQueue] Criando contêiner para item ${i + 1}/${imageUrls.length} do carrossel...`);
                    const itemRes = await client.createMediaContainer({
                        mediaType: 'IMAGE',
                        imageUrl: url,
                        isCarouselItem: true,
                    });
                    itemContainerIds.push(itemRes.id);
                    // Garante processamento de cada imagem filha
                    await this.pollContainerUntilReady(client, itemRes.id, 40);
                }

                // Pausa de 2 segundos para garantir sincronização na infraestrutura da Meta
                await sleep(2000);

                let finalText = text || '';
                if (topicTag && topicTag.length > 0) {
                    const hashtags = `#${topicTag.replace(/ /g, '')}`;
                    finalText = finalText ? `${hashtags}\n${finalText}` : hashtags;
                }

                Logger.info('[ThreadsQueue] Criando contêiner principal do carrossel...');
                const carouselContainer = await client.createMediaContainer({
                    mediaType: 'CAROUSEL',
                    text: finalText ? finalText.replace('\t', '') : undefined,
                    children: itemContainerIds,
                });

                creationId = carouselContainer.id;
                // Aguarda o carrossel principal ficar pronto
                await this.pollContainerUntilReady(client, creationId, 45);
            }
        }

        // Publica o contêiner
        Logger.info(`[ThreadsQueue] Publicando contêiner ID: ${creationId}...`);
        const publishResult = await client.publish({ creationId });
        return { postId: publishResult.id };
    }
}

export const threadsQueue = new ThreadsQueueManager();
