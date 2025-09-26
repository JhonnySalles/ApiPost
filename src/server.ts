import { loadSecrets } from './config/secrets';
loadSecrets();

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import Logger from './config/logger';
import authRoutes from './routes/authRoutes';
import tumblrRoutes from './routes/tumblrRoutes';
import twitterRoutes from './routes/twitterRoutes';
import blueskyRoutes from './routes/blueskyRoutes';
import threadsRoutes from './routes/threadsRoutes';
import publishAllRoutes from './routes/publishAllRoutes';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
        Sentry.httpIntegration(),
        Sentry.expressIntegration(),
        nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,

    beforeSend(event, hint) {
        if (event.level === 'warning' || event.level === 'error' || event.level === 'fatal') {
            Logger.warn(`Evento Sentry sendo enviado: ${event.event_id}`);
            return event;
        }
        return null;
    },
});

const app = express();
const port = process.env.PORT || 8080;

const server = http.createServer(app);
export const io = new Server(server, {
    cors: {
        origin: "*", // Em produção, restrinja para o domínio do seu app cliente
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    Logger.info(`🔌 Novo cliente conectado: ${socket.id}`);

    socket.on('disconnect', () => {
        Logger.info(`🔌 Cliente desconectado: ${socket.id}`);
    });
});

server.listen(port, 0, () => {
    console.log(`Servidor escutando em 0.0.0.0 na porta ${port}`);
});

//app.use(Sentry.expressRequestHandler());

app.use(express.json({ limit: '50mb' }));

const swaggerFilePath = path.join(process.cwd(), 'swagger-spec.yaml');
const swaggerFileContent = fs.readFileSync(swaggerFilePath, 'utf8');
const swaggerDocs = yaml.load(swaggerFileContent) as object;

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.get(['/swagger-ui.html', '/docs', '/documentacao', '/'], (req, res) => {
    res.redirect('/api-docs');
});

/**
 * @openapi
 * paths:
 *   /health:
 *     get:
 *       summary: Rota de verificação
 *       tags: [Healthcheck]
 *       description: |
 *                    Verifica a saúde e a disponibilidade da API. Este é um endpoint público e não autenticado, projetado para ser usado como uma verificação de "health check" por serviços de monitoramento ou para um teste rápido de conectividade para confirmar que o serviço está no ar.
 *                   
 *                    **Parâmetros de Path:**
 *                    * Nenhum.
 *                   
 *                    **Corpo da Requisição:**
 *                    * N/A (requisições `GET` não possuem corpo).
 *                   
 *                    **Corpo da Resposta:**
 *                    * Retorna uma mensagem de texto simples (`text/html`) confirmando que a API está em execução (status `200 OK`).
 *                    * Este endpoint não possui respostas de erro específicas documentadas.
 *     responses:
 *       '200':
 *         description: Sucesso.
 */
app.get('/health', (req, res) => {
    res.send('A API está funcionando! Acesse /api-docs para ver a documentação.');
});

app.use('/auth', authRoutes);
app.use('/publish-all', publishAllRoutes);
app.use('/tumblr', tumblrRoutes);
app.use('/twitter', twitterRoutes);
app.use('/x', twitterRoutes);
app.use('/bluesky', blueskyRoutes);
app.use('/threads', threadsRoutes);

app.use(Sentry.expressErrorHandler());
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    Logger.error('Erro não tratado capturado pelo handler final: %o', err.message || err);
    res.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
});

app.listen(port, () => {
    Logger.info(`🚀 Servidor rodando em http://localhost:${port}`);
    Logger.info(`📚 Documentação disponível em http://localhost:${port}/api-docs`);
});