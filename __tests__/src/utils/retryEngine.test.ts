import { withRetry } from '../../../src/utils/retryEngine';

describe('retryEngine', () => {
    it('deve retornar o resultado imediatamente se a função for bem-sucedida', async () => {
        const fn = jest.fn().mockResolvedValue('ok');
        const result = await withRetry(fn, { maxAttempts: 3, initialDelayMs: 10 });
        expect(result).toBe('ok');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('deve tentar novamente até o sucesso se ocorrer erro recuperável', async () => {
        const fn = jest
            .fn()
            .mockRejectedValueOnce(new Error('Falha temporária 1'))
            .mockRejectedValueOnce(new Error('Falha temporária 2'))
            .mockResolvedValue('sucesso na tentativa 3');

        const onRetry = jest.fn();
        const result = await withRetry(fn, {
            maxAttempts: 3,
            initialDelayMs: 10,
            backoffFactor: 1.5,
            jitter: false,
            onRetry,
        });

        expect(result).toBe('sucesso na tentativa 3');
        expect(fn).toHaveBeenCalledTimes(3);
        expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it('deve lançar erro se atingir o número máximo de tentativas', async () => {
        const fn = jest.fn().mockRejectedValue(new Error('Erro persistente'));
        await expect(
            withRetry(fn, {
                maxAttempts: 3,
                initialDelayMs: 10,
                jitter: false,
            })
        ).rejects.toThrow('Erro persistente');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('não deve tentar novamente se isRetryable retornar false', async () => {
        const fn = jest.fn().mockRejectedValue(new Error('Token inválido'));
        await expect(
            withRetry(fn, {
                maxAttempts: 3,
                initialDelayMs: 10,
                isRetryable: (err) => !err.message.includes('Token inválido'),
            })
        ).rejects.toThrow('Token inválido');
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
