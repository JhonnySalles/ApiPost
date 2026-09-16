import { classifyThreadsError } from '../../../src/utils/threadsErrorClassifier';
import { ThreadsApiError } from '@libs/threads-graph-api/index.js';

describe('threadsErrorClassifier', () => {
    it('deve identificar erro de autenticação / token expirado como não-retryable', () => {
        const error = new ThreadsApiError({
            error: {
                message: 'Error validating access token: The session has been invalidated.',
                type: 'OAuthException',
                code: 190,
                fbtrace_id: 'trace123',
            },
        });

        const classified = classifyThreadsError(error);
        expect(classified.isAuthError).toBe(true);
        expect(classified.isRetryable).toBe(false);
    });

    it('deve identificar erro desconhecido (code 1) como retryable', () => {
        const error = new ThreadsApiError({
            error: {
                message: 'An unknown error occurred',
                type: 'OAuthException',
                code: 1,
                fbtrace_id: 'trace456',
            },
        });

        const classified = classifyThreadsError(error);
        expect(classified.isTransient).toBe(true);
        expect(classified.isRetryable).toBe(true);
    });

    it('deve identificar erro de processamento de contêiner (code 24) como retryable', () => {
        const error = new ThreadsApiError({
            error: {
                message: 'The requested resource does not exist',
                type: 'OAuthException',
                code: 24,
                fbtrace_id: 'trace789',
            },
        });

        const classified = classifyThreadsError(error);
        expect(classified.isProcessingDelay).toBe(true);
        expect(classified.isRetryable).toBe(true);
    });

    it('deve identificar erro de rate limit (code 4) como retryable', () => {
        const error = new ThreadsApiError({
            error: {
                message: 'Application request limit reached',
                type: 'OAuthException',
                code: 4,
                fbtrace_id: 'trace101',
            },
        });

        const classified = classifyThreadsError(error);
        expect(classified.isRateLimit).toBe(true);
        expect(classified.isRetryable).toBe(true);
    });

    it('deve classificar erros genéricos de rede', () => {
        const error = new Error('connect ECONNRESET');
        const classified = classifyThreadsError(error);
        expect(classified.isTransient).toBe(true);
        expect(classified.isRetryable).toBe(true);
    });
});
