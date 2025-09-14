// src/routes/authRoutes.ts

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Logger from '../config/logger';
import * as Sentry from '@sentry/node';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const API_USER = process.env.API_USER;
const API_PASSWORD = process.env.API_PASSWORD;
const API_ACCESS_TOKEN = process.env.API_ACCESS_TOKEN;
const TOKEN_EXPIRATION_IN_SECONDS = 24 * 60 * 60;

/**
 * @openapi
 * /auth/login:
 *  post:
 *    summary: Autentica o usuário e retorna um token JWT.
 *    tags: [Autenticação]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            allOf:
 *              - $ref: '#/components/schemas/SocialPostRequest'
 *              - type: object
 *                properties:
 *                  accessToken: { type: string }
 *          example:
 *            username: "seu-usuario"
 *            password: "sua-senha-forte"
 *            accessToken: "um-token-secreto-e-longo"
 *    responses:
 *      '200':
 *        description: Login bem-sucedido.
 *        content:
 *          application/json:
 *            example:
 *              message: "Autenticação bem-sucedida!"
 *              token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *              expiresAt: "2025-09-14T22:38:59.123Z"
 *      '401':
 *        description: Credenciais inválidas.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', (req: Request, res: Response) => {
    try {
        const { username, password, accessToken } = req.body;

        if (!username || !password || !accessToken)
            return res.status(400).json({ message: 'Usuário, senha e accessToken são obrigatórios.' });

        const isCredentialsValid = username === API_USER && password === API_PASSWORD;
        const isAccessTokenValid = accessToken === API_ACCESS_TOKEN;

        console.log(`Credenciais válidas: ${isCredentialsValid}, Token de acesso válido: ${isAccessTokenValid}`);

        if (!isCredentialsValid || !isAccessTokenValid)
            return res.status(401).json({ message: 'Credenciais inválidas.' });

        const token = jwt.sign({ username: username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION_IN_SECONDS });

        const expirationDate = new Date(Date.now() + TOKEN_EXPIRATION_IN_SECONDS * 1000);

        res.status(200).json({ message: 'Autenticação bem-sucedida!', token: token, expiration: expirationDate.toISOString(), });
    } catch (error) {
        Sentry.captureException(error);
        Logger.error('Erro inesperado no endpoint /login:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});


/**
 * @openapi
 * /auth/token/refresh:
 *  post:
 *    summary: Renova um token JWT expirado.
 *    tags: [Autenticação]
 *    security:
 *      - bearerAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            allOf:
 *              - $ref: '#/components/schemas/SocialPostRequest'
 *              - type: object
 *                properties:
 *                  accessToken: { type: string }
 *          example:
 *            accessToken: "um-token-secreto-e-longo"
 *    responses:
 *      '200':
 *        description: Token renovado com sucesso.
 *      '401':
 *        description: Token inválido/ausente.
 */
router.post('/token/refresh', (req: Request, res: Response) => {
    try {
        const { accessToken } = req.body;
        const authHeader = req.headers['authorization'];
        const oldToken = authHeader && authHeader.split(' ')[1];

        if (accessToken !== API_ACCESS_TOKEN || !oldToken)
            return res.status(401).json({ message: 'Token de acesso ou token JWT ausente/inválido.' });

        jwt.verify(oldToken, JWT_SECRET, { ignoreExpiration: true }, (err, decoded) => {
            if (err)
                return res.status(401).json({ message: 'Token JWT inválido.' });

            const payload = decoded as { username: string };
            const newToken = jwt.sign({ username: payload.username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION_IN_SECONDS });

            const newExpirationDate = new Date(Date.now() + TOKEN_EXPIRATION_IN_SECONDS * 1000);

            res.status(200).json({ message: 'Token renovado com sucesso!', token: newToken, expiration: newExpirationDate.toISOString(), });
        });
    } catch (error) {
        Sentry.captureException(error);
        Logger.error('Erro inesperado no endpoint /token/refresh:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

export default router;