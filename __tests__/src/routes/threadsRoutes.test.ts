import request from 'supertest';
import { app } from '../../../src/server';

jest.setTimeout(25000);

describe('Threads Routes', () => {
    it('deve retornar 202 e enfileirar o post com sucesso', async () => {
        const response = await request(app)
            .post('/threads/post')
            .send({
                text: 'Teste Threads!',
                tags: ['meta'],
            });

        expect(response.status).toBe(202);
        expect(response.body.message).toContain('enfileirado com sucesso');
        expect(response.body.data.jobId).toBeDefined();
        expect(['queued', 'processing']).toContain(response.body.data.status);

        const jobId = response.body.data.jobId;

        // Aguarda processamento do job em background
        await new Promise((resolve) => setTimeout(resolve, 800));

        const statusRes = await request(app).get(`/threads/status/${jobId}`);
        expect(statusRes.status).toBe(200);
        expect(statusRes.body.jobId).toBe(jobId);
        expect(['processing', 'completed']).toContain(statusRes.body.status);
    });

    it('deve retornar status da fila em /threads/queue/status', async () => {
        const response = await request(app).get('/threads/queue/status');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('queuedCount');
        expect(response.body).toHaveProperty('isProcessing');
        expect(response.body).toHaveProperty('totalTracked');
    });

    it('deve retornar 404 para jobId inexistente em /threads/status/:jobId', async () => {
        const response = await request(app).get('/threads/status/uuid-inexistente-123');
        expect(response.status).toBe(404);
        expect(response.body.message).toContain('não encontrado');
    });

    it('deve retornar 400 se o texto e imagens estiverem ausentes', async () => {
        const response = await request(app)
            .post('/threads/post')
            .send({
                tags: ['teste'],
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('É necessário fornecer texto ou imagens');
    });
});
