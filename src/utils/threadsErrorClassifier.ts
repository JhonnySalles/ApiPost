import { ThreadsApiError } from '@libs/threads-graph-api/index.js';

export interface ThreadsErrorInfo {
    isRetryable: boolean;
    isTransient: boolean;
    isRateLimit: boolean;
    isAuthError: boolean;
    isProcessingDelay: boolean;
    errorCode?: number;
    errorMessage: string;
}

export function classifyThreadsError(error: any): ThreadsErrorInfo {
    let errorCode: number | undefined;
    let errorMessage = '';

    if (error instanceof ThreadsApiError) {
        const details = error.getThreadsError();
        errorCode = details?.error?.code;
        errorMessage = details?.error?.message || error.message || '';
    } else if (error instanceof Error) {
        errorMessage = error.message;
    } else {
        errorMessage = String(error);
    }

    const lowerMsg = errorMessage.toLowerCase();

    // 1. Auth errors (Token expired/invalid - Code 190) -> NEVER retry
    const isAuthError = errorCode === 190 || lowerMsg.includes('oauth') || lowerMsg.includes('access token');
    if (isAuthError) {
        return {
            isRetryable: false,
            isTransient: false,
            isRateLimit: false,
            isAuthError: true,
            isProcessingDelay: false,
            errorCode,
            errorMessage,
        };
    }

    // 2. Rate limit (Codes 4, 17, 32, 613, or message) -> RETRYABLE with backoff
    const isRateLimit = errorCode === 4 || errorCode === 17 || errorCode === 32 || errorCode === 613 || lowerMsg.includes('rate limit') || lowerMsg.includes('request limit reached');

    // 3. Container processing delay / not ready (Code 24 or "invalid parameter" during carousel creation)
    const isProcessingDelay =
        errorCode === 24 ||
        lowerMsg.includes('invalid parameter') ||
        lowerMsg.includes('not ready') ||
        lowerMsg.includes('in_progress') ||
        lowerMsg.includes('media container is not ready');

    // 4. Transient unknown errors (Code 1, Code 2, Network errors, 5xx)
    const isTransient =
        errorCode === 1 ||
        errorCode === 2 ||
        lowerMsg.includes('unknown error') ||
        lowerMsg.includes('timeout') ||
        lowerMsg.includes('econnreset') ||
        lowerMsg.includes('temporarily unavailable') ||
        lowerMsg.includes('teste de excessão');

    const isRetryable = isRateLimit || isProcessingDelay || isTransient;

    return {
        isRetryable,
        isTransient,
        isRateLimit,
        isAuthError,
        isProcessingDelay,
        errorCode,
        errorMessage,
    };
}
