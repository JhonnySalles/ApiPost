import request from 'supertest';
import { app } from '../../src/server';

describe('Healthcheck Route', () => {
    it('deve retornar 200 ao acessar /health', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.text).toContain('A API está funcionando');
    });
});
