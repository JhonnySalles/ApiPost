export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
    maxDelayMs?: number;
    jitter?: boolean;
    isRetryable?: (error: any) => boolean;
    onRetry?: (attempt: number, delayMs: number, error: any) => void;
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executa uma função assíncrona com retry exponencial e jitter.
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxAttempts = 3,
        initialDelayMs = 2000,
        backoffFactor = 2,
        maxDelayMs = 30000,
        jitter = true,
        isRetryable = () => true,
        onRetry,
    } = options;

    let attempt = 0;
    while (true) {
        attempt++;
        try {
            return await fn();
        } catch (error: any) {
            if (attempt >= maxAttempts || !isRetryable(error)) {
                throw error;
            }

            // Exponential backoff
            let delayMs = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
            if (delayMs > maxDelayMs) {
                delayMs = maxDelayMs;
            }

            // Jitter (adds between 0 and 20% random variance)
            if (jitter) {
                const jitterVariance = delayMs * 0.2 * Math.random();
                delayMs = Math.round(delayMs + jitterVariance);
            }

            if (onRetry) {
                onRetry(attempt, delayMs, error);
            }

            await sleep(delayMs);
        }
    }
}
