import request from 'supertest';
import { app, io } from '../../../src/server';

describe('Publish All Routes', () => {
    it('deve retornar 202 e iniciar processamento em lote', async () => {
        const response = await request(app)
            .post('/publish-all/post')
            .send({
                platforms: ['twitter', 'bluesky'],
                text: 'Postagem múltipla!',
                socketId: 'mock-socket-id',
                instanceId: 'inst-1',
                postId: 'post-1'
            });

        expect(response.status).toBe(202);
        expect(response.body.message).toBe('Processamento em lote iniciado. Você será notificado via callback.');
    });

    it('deve validar a presença de plataformas', async () => {
        const response = await request(app)
            .post('/publish-all/post')
            .send({
                text: 'Sem plataformas',
                socketId: 'mock-socket-id'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('O array de plataformas é obrigatório.');
    });
});
