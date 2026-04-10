import Logger from '../../../src/config/logger';
import winston from 'winston';

describe('Logger configuration', () => {
    it('deve prover uma instância winston bem formatada a partir das configs', () => {
        expect(Logger).toBeDefined();
        // Logger precisa preencher a signature do Winston
        expect(Logger.info).toBeInstanceOf(Function);
        expect(Logger.error).toBeInstanceOf(Function);
        expect(Logger.warn).toBeInstanceOf(Function);
    });

    it('deve conter uma rotina global de transports (Console, File loggers)', () => {
        expect(Logger.transports.length).toBeGreaterThanOrEqual(1);

        // Verifica especificamente pelo transport que joga log no console (standard p desenvolvimento)
        const temConsoleTransport = Logger.transports.some(
            (t: any) => t instanceof winston.transports.Console
        );
        expect(temConsoleTransport).toBeTruthy();
    });
});
