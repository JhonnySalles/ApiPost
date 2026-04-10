import admin from 'firebase-admin';
import Logger from '../../../src/config/logger';

jest.mock('../../../src/config/logger');

describe('firebaseService singleton', () => {
    const OLD_ENV = { ...process.env };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...OLD_ENV };
        (admin as any).apps = [];
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

    it('deve inicializar com o databaseURL injetado no SDK do firebaseAdmin caso o contexto esteja limpo', () => {
        jest.isolateModules(() => {
            process.env.FIREBASE_DATABASE_URL = 'https://meu-test-db.firebaseio.com';
            const { db } = require('../../../src/services/firebaseService');

            expect(admin.initializeApp).toHaveBeenCalledWith({ databaseURL: 'https://meu-test-db.firebaseio.com' });
            expect(admin.database).toHaveBeenCalled();
            expect(db).toBeDefined();
            expect(Logger.info).toHaveBeenCalledWith(expect.stringContaining('Firebase Admin SDK inicializado com sucesso.'));
        });
    });

    it('deve logar de forma controlada repassando um ValidationError caso databaseURL não seja fornecida', () => {
        jest.isolateModules(() => {
            delete process.env.FIREBASE_DATABASE_URL;
            require('../../../src/services/firebaseService');

            expect(Logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Erro ao inicializar o Firebase Admin SDK:'),
                expect.objectContaining({ name: 'ValidationError', message: 'A variável de ambiente FIREBASE_DATABASE_URL não está definida.' })
            );
        });
    });

    it('nao deve tentar escalar com chamadas sucessivas do initializeApp se admin.apps estiver popular (já bootado)', () => {
        jest.isolateModules(() => {
            process.env.FIREBASE_DATABASE_URL = 'https://fake-db.firebaseio.com';
            
            // Simula app já inicializado
            (admin as any).apps = [{}];

            require('../../../src/services/firebaseService');

            expect(admin.initializeApp).not.toHaveBeenCalled();
            expect(admin.database).toHaveBeenCalled();
        });
    });
});
