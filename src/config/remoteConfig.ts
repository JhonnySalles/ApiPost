import Logger from './logger';
import { db } from '../services/firebaseService';

interface ThreadsRefreshResponse {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    error?: {
        message?: string;
        type?: string;
        code?: number;
    };
}

/**
 * Atualiza o token do Threads se a data de expiração estiver a 3 dias ou menos do vencimento.
 */
async function checkAndRefreshThreadsToken(accessToken?: string, expiresAtIso?: string): Promise<void> {
    if (!accessToken) {
        Logger.warn('[RemoteConfig] THREADS_ACCESS_TOKEN não está definido. Pulando verificação de renovação.');
        return;
    }

    let shouldRefresh = false;

    if (!expiresAtIso) {
        Logger.warn('[RemoteConfig] THREADS_TOKEN_EXPIRES_AT não encontrado ou vazio. Tentando renovar para obter nova validade...');
        shouldRefresh = true;
    } else {
        const expirationDate = new Date(expiresAtIso);
        if (isNaN(expirationDate.getTime())) {
            Logger.warn(`[RemoteConfig] Formato de data inválido para THREADS_TOKEN_EXPIRES_AT: "${expiresAtIso}". Tentando renovar...`);
            shouldRefresh = true;
        } else {
            const now = new Date();
            const timeDifferenceMs = expirationDate.getTime() - now.getTime();
            const daysRemaining = timeDifferenceMs / (1000 * 60 * 60 * 24);

            Logger.info(`[RemoteConfig] Validade do token do Threads: expira em ${daysRemaining.toFixed(2)} dias (${expirationDate.toISOString()}).`);

            if (daysRemaining <= 3) {
                Logger.info(`[RemoteConfig] Token do Threads vence em menos de 3 dias (ou expirou). Iniciando renovação...`);
                shouldRefresh = true;
            }
        }
    }

    if (!shouldRefresh) {
        return;
    }

    try {
        const refreshUrl = `https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${accessToken}`;
        const response = await fetch(refreshUrl, { method: 'GET' });
        const data = (await response.json()) as ThreadsRefreshResponse;

        if (!response.ok || !data.access_token) {
            Logger.error('[RemoteConfig] Falha ao renovar token do Threads: %o', data);
            return;
        }

        const newToken = data.access_token;
        // expires_in geralmente retorna segundos (ex: 5184000 = 60 dias)
        const expiresInSeconds = data.expires_in || 60 * 24 * 60 * 60;
        const newExpirationDate = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

        // Atualiza na memória
        process.env.THREADS_ACCESS_TOKEN = newToken;
        process.env.THREADS_TOKEN_EXPIRES_AT = newExpirationDate;

        // Persiste no Firebase
        if (db) {
            await db.ref('chaves').update({
                THREADS_ACCESS_TOKEN: newToken,
                THREADS_TOKEN_EXPIRES_AT: newExpirationDate,
            });
            Logger.info(`[RemoteConfig] 🎉 Token do Threads renovado com sucesso! Nova expiração: ${newExpirationDate}`);
        }
    } catch (error) {
        Logger.error('[RemoteConfig] Erro ao comunicar com a API do Threads para renovação: %o', error);
    }
}

/**
 * Carrega as chaves do Firebase Realtime Database no nó "chaves" e atualiza o process.env.
 * Caso o Firebase não esteja disponível, preserva o process.env local.
 */
export async function loadRemoteSecrets(): Promise<void> {
    try {
        if (!db) {
            Logger.warn('[RemoteConfig] Instância do Firebase Realtime Database não inicializada. Mantendo variáveis locais.');
            return;
        }

        Logger.info('[RemoteConfig] Buscando configurações e chaves no Firebase Realtime Database (nó "chaves")...');
        const snapshot = await db.ref('chaves').once('value');

        if (!snapshot.exists()) {
            Logger.warn('[RemoteConfig] Nó "chaves" não encontrado no Firebase. Usando variáveis locais padrão.');
            return;
        }

        const keys = snapshot.val();
        if (typeof keys === 'object' && keys !== null) {
            let loadedCount = 0;
            for (const [key, value] of Object.entries(keys)) {
                if (value !== undefined && value !== null) {
                    process.env[key.toUpperCase()] = String(value);
                    loadedCount++;
                }
            }
            Logger.info(`[RemoteConfig] ✅ ${loadedCount} chave(s) carregada(s) do Firebase e aplicadas ao process.env com sucesso.`);
        }

        // Executa a checagem e renovação do token do Threads
        const threadsToken = process.env.THREADS_ACCESS_TOKEN;
        const threadsExpiresAt = process.env.THREADS_TOKEN_EXPIRES_AT;
        await checkAndRefreshThreadsToken(threadsToken, threadsExpiresAt);
    } catch (error) {
        Logger.error('[RemoteConfig] ❌ Falha ao carregar chaves do Firebase. O sistema continuará com as variáveis locais: %o', error);
    }
}
