// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Logger from '../config/logger';

export const protect = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        Logger.warn('Tentativa de acesso sem token JWT.');
        return res.status(401).json({ message: 'Não autorizado, token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        Logger.error('Falha na verificação do token JWT.', error);
        return res.status(401).json({ message: 'Não autorizado, token inválido.' });
    }
};