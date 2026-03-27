import request from 'supertest';
import { app } from '../../../src/server';

jest.setTimeout(15000);

jest.mock('tumblr.js', () => ({
    createClient: jest.fn().mockReturnValue({
        userInfo: jest.fn().mockResolvedValue({
            user: {
                blogs: [
                    { name: 'blog1', title: 'Blog Um' },
                    { name: 'blog2', title: 'Blog Dois' }
                ]
            }
        }),
        createPost: jest.fn().mockResolvedValue({ id: '123' })
    })
}));

describe('Tumblr Routes', () => {
    describe('GET /tumblr/blogs', () => {
        it('deve retornar a lista de blogs', async () => {
            const response = await request(app).get('/tumblr/blogs');
            expect(response.status).toBe(200);
            expect(response.body.blogs).toHaveLength(2);
            expect(response.body.blogs[0]).toHaveProperty('name', 'blog1');
        });
    });

    describe('POST /tumblr/post', () => {
        it('deve retornar 200 ao postar com sucesso (simulado)', async () => {
            const response = await request(app)
                .post('/tumblr/post')
                .send({
                    blogName: 'blog1',
                    text: 'Teste Tumblr!',
                    tags: ['teste']
                })
                .timeout(10000);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Post criado com sucesso!');
        });

        it('deve retornar 400 se blogName estiver ausente', async () => {
            const response = await request(app)
                .post('/tumblr/post')
                .send({
                    text: 'Teste Tumblr!'
                })
                .timeout(10000);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('O nome do blog (blogName) é obrigatório');
        });

        it('deve retornar 500 ao simular erro via TEST_ERROR', async () => {
            process.env.TEST_ERROR = 'true';
            const response = await request(app)
                .post('/tumblr/post')
                .send({
                    blogName: 'blog1',
                    text: 'Teste Tumblr de erro!',
                    tags: ['teste', 'erro']
                })
                .timeout(10000);

            delete process.env.TEST_ERROR;

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Teste de excessão');
        });
    });
});
