import request from 'supertest';
import { app } from '../../../src/server';

jest.setTimeout(15000);

describe('Threads Routes', () => {
    it('deve retornar 200 ao postar no Threads (simulado por IGNORAR_POST)', async () => {
        const response = await request(app)
            .post('/threads/post')
            .send({
                text: 'Teste Threads!',
                tags: ['meta']
            });

        expect(response.status).toBe(200);
        expect(response.body.data.postId).toBe('[Threads] Ignorado o envio do post.');
    });

    it('deve retornar 400 se o texto ou imagens estiverem ausentes', async () => {
        const response = await request(app)
            .post('/threads/post')
            .send({
                tags: ['teste']
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('É necessário fornecer texto ou imagens');
    });

    it('deve retornar 500 ao simular erro via TEST_ERROR', async () => {
        process.env.TEST_ERROR = 'true';
        const response = await request(app)
            .post('/threads/post')
            .send({
                text: 'Teste Threads de erro!',
                tags: ['teste', 'erro']
            });

        delete process.env.TEST_ERROR;

        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Teste de excessão');
    });
});
