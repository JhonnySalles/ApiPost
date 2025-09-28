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
 *    description: |
 *                 Autentica na API utilizando um conjunto de credenciais pré-definidas e retorna um token de acesso JWT. Este token é necessário para autorizar todas as outras requisições aos endpoints protegidos da aplicação. O token gerado possui uma validade de 24 horas.
 *                
 *                 **Corpo da Requisição:**
 *                 * **`username`** (string, obrigatório): O nome de usuário definido para a API.
 *                 * **`password`** (string, obrigatório): A senha definida para a API.
 *                 * **`accessToken`** (string, obrigatório): Um token de acesso estático que atua como uma camada adicional de segurança.
 *                
 *                 **Corpo da Resposta:**
 *                 * Retorna um objeto contendo a mensagem de sucesso, o token JWT e a data de expiração no formato ISO 8601 (status `200 OK`).
 *                 * Retorna um erro `401 Unauthorized` caso qualquer uma das credenciais fornecidas seja inválida.
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

        if (!isCredentialsValid || !isAccessTokenValid)
            return res.status(401).json({ message: 'Credenciais inválidas.' });

        const token = jwt.sign({ username: username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION_IN_SECONDS });

        const expirationDate = new Date(Date.now() + TOKEN_EXPIRATION_IN_SECONDS * 1000);

        Logger.info(`[Auth] Autenticação bem-sucedida: ${username}`);
        res.status(200).json({ message: 'Autenticação bem-sucedida!', token: token, expiration: expirationDate.toISOString(), });
    } catch (error) {
        Sentry.captureException(error);
        Logger.error('[Auth] Erro inesperado no endpoint /login: %o', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});


/**
 * @openapi
 * /auth/token/refresh:
 *  post:
 *    summary: Renova um token JWT expirado.
 *    tags: [Autenticação]
 *    description: |
 *                 Gera um novo token de acesso JWT com validade de 24 horas a partir de um token existente, mesmo que este já esteja expirado. Este endpoint é utilizado para manter a sessão do cliente ativa sem a necessidade de enviar as credenciais de `username` e `password` novamente.
 *               
 *                 **Cabeçalho da Requisição:**
 *                 * **`Authorization`**: Deve conter o token JWT atual (mesmo que expirado) no formato `Bearer SEU_TOKEN_AQUI`.
 *               
 *                 **Corpo da Requisição:**
 *                 * **`accessToken`** (string, obrigatório): O mesmo token de acesso estático usado no login, para validar a legitimidade da requisição de renovação.
 *               
 *                 **Corpo da Resposta:**
 *                 * Retorna um objeto com a mensagem de sucesso, o **novo** token JWT e a sua **nova** data de expiração (status `200 OK`).
 *                 * Retorna um erro `401 Unauthorized` se o token antigo for inválido (assinatura incorreta) ou se o `accessToken` não corresponder.
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

            Logger.info(`[Auth] Token renovado com sucesso: ${payload.username}`);
            res.status(200).json({ message: 'Token renovado com sucesso!', token: newToken, expiration: newExpirationDate.toISOString(), });
        });
    } catch (error) {
        Sentry.captureException(error);
        Logger.error('[Auth] Erro inesperado no endpoint /token/refresh: %o', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

export default router;