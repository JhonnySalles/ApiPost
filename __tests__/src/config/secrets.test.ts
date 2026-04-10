import { loadSecrets } from '../../../src/config/secrets';
import dotenv from 'dotenv';
import Logger from '../../../src/config/logger';

jest.mock('dotenv');
jest.mock('../../../src/config/logger');

describe('secrets loader', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...OLD_ENV };
        process.env.TEST_ENV = 'true';
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

    it('deve delegar a resolucao de rotas de config env ao dotenv quando ausente o ambiente Cloud Run', () => {
        delete process.env.K_SERVICE; // Garante sem ambiente Cloud Run
        loadSecrets();

        expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('Ambiente local detectado'));
        expect(dotenv.config).toHaveBeenCalled();
    });

    it('deve interromper o build da env de maneira elegante falhando se o cluster possuir a flag K_SERVICE porem obsoleto do JSON da config', () => {
        process.env.K_SERVICE = 'true';
        delete process.env.API_POST_SECRETS_JSON;

        loadSecrets();

        expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('não foi encontrada em produção!'));
    });

    it('deve logar um erro catastrófico perante um JSON de segredos inválido e corrompido que estoure o parser', () => {
        process.env.K_SERVICE = 'true';
        process.env.API_POST_SECRETS_JSON = '{ bad_format: faltam.aspas }';

        loadSecrets();

        expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('Falha ao fazer o parse do JSON de segredos:'), expect.any(Error));
    });

    it('deve ser capaz de achatar chaves de nivel profundo recursivamente injetando-os como variaveis flat de uppercase no process.env', () => {
        process.env.K_SERVICE = 'true';
        const mockSecrets = {
            DATABASE: { URL: 'mysql://localhost:3306' },
            TWITTER_API_KEY: '123_abc_xyz'
        };
        process.env.API_POST_SECRETS_JSON = JSON.stringify(mockSecrets);

        loadSecrets();

        expect(Logger.info).toHaveBeenCalledWith(expect.stringContaining('Ambiente de produção (Cloud Run) detectado'));
        expect(Logger.info).toHaveBeenCalledWith(expect.stringContaining('Segredos do JSON carregados com sucesso'));

        // Verifica se function flattenAndSetEnv completou perfeitamente 
        expect(process.env.DATABASE_URL).toBe('mysql://localhost:3306');
        expect(process.env.TWITTER_API_KEY).toBe('123_abc_xyz');
    });
});
