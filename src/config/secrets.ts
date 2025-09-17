import dotenv from 'dotenv';
import Logger from './logger';

/**
 * Função recursiva para achatar um objeto JSON aninhado e popular process.env.
 * Ex: { "TUMBLR": { "KEY": "123" } } se torna process.env.TUMBLR_KEY = "123"
 * @param obj O objeto de segredos.
 * @param prefix O prefixo a ser usado para as chaves (usado na recursão).
 */
function flattenAndSetEnv(obj: any, prefix = '') {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const newKey = prefix ? `${prefix}_${key}` : key;
            const value = obj[key];
            if (typeof value === 'object' && value !== null && !Array.isArray(value))
                flattenAndSetEnv(value, newKey.toUpperCase());
            else
                process.env[newKey.toUpperCase()] = String(value);

        }
    }
}

export function loadSecrets() {
    if (process.env.K_SERVICE) {
        Logger.info('Ambiente de produção (Cloud Run) detectado. Carregando segredos do JSON.');

        const secretsJsonString = process.env.API_POST_SECRETS_JSON;
        if (!secretsJsonString) {
            Logger.error('ERRO: A variável de ambiente API_POST_SECRETS_JSON não foi encontrada em produção!');
            return;
        }

        try {
            const secrets = JSON.parse(secretsJsonString);
            flattenAndSetEnv(secrets);
            Logger.info('Segredos do JSON carregados com sucesso em process.env.');
        } catch (error) {
            Logger.error('ERRO: Falha ao fazer o parse do JSON de segredos.', error);
        }
    } else {
        Logger.warn('Ambiente local detectado. Carregando segredos do arquivo .env.');
        dotenv.config();
    }
}