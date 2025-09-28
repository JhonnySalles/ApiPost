import admin from 'firebase-admin';
import Logger from '../config/logger';

export const BASE_DOCUMENT = 'post_status';

let db: admin.database.Database;

try {
    if (!admin.apps.length) {
        const databaseURL = process.env.FIREBASE_DATABASE_URL;

        if (!databaseURL)
            throw new Error('A variável de ambiente FIREBASE_DATABASE_URL não está definida.');

        admin.initializeApp({ databaseURL: databaseURL });
        Logger.info('[Firebase] Firebase Admin SDK inicializado com sucesso.');
    }

    db = admin.database();
} catch (error) {
    Logger.error('[Firebase] Erro ao inicializar o Firebase Admin SDK:', error);

    //$env:GOOGLE_APPLICATION_CREDENTIALS="C:\..local..\ApiPost\firebase-service-account.json" // Instalar a variavel com o local do json do firebase
    if (process.env.NODE_ENV !== 'production' && error instanceof Error && error.message.includes('Credential'))
        Logger.warn('DICA: Para desenvolvimento local, verifique se o arquivo "firebase-service-account.json" está na raiz do projeto e se a variável de ambiente GOOGLE_APPLICATION_CREDENTIALS está configurada.');
}

export { db };