import request from 'supertest';
import { app } from '../../../src/server';
import jwt from 'jsonwebtoken';

describe('Auth Routes', () => {
    const backupEnv = { ...process.env };

    beforeAll(() => {
        process.env.API_USER = 'testuser';
        process.env.API_PASSWORD = 'testpassword';
        process.env.API_ACCESS_TOKEN = 'testaccesstoken';
        process.env.JWT_SECRET = 'testsecret';
    });

    afterAll(() => {
        process.env = backupEnv;
    });

    describe('POST /auth/login', () => {
        it('deve retornar 200 e um token para credenciais válidas', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'testpassword',
                    accessToken: 'testaccesstoken'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.message).toBe('Autenticação bem-sucedida!');
        });

        it('deve retornar 401 para credenciais inválidas', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    username: 'wronguser',
                    password: 'wrongpassword',
                    accessToken: 'wrongtoken'
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Credenciais inválidas.');
        });

        it('deve retornar 400 se campos obrigatórios estiverem ausentes', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    username: 'testuser'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Usuário, senha e accessToken são obrigatórios.');
        });
    });

    describe('POST /auth/token/refresh', () => {
        it('deve renovar o token com sucesso', async () => {
            const token = jwt.sign({ username: 'testuser' }, process.env.JWT_SECRET!, { expiresIn: '1h' });
            
            const response = await request(app)
                .post('/auth/token/refresh')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    accessToken: 'testaccesstoken'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.message).toBe('Token renovado com sucesso!');
        });

        it('deve retornar 410 se o accessToken for inválido', async () => {
             const token = jwt.sign({ username: 'testuser' }, process.env.JWT_SECRET!, { expiresIn: '1h' });
            
            const response = await request(app)
                .post('/auth/token/refresh')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    accessToken: 'wrongtoken'
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Token de acesso ou token JWT ausente/inválido.');
        });
    });
});
