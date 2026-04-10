import { Request, Response, NextFunction } from 'express';
import { protect } from '../../../src/middleware/authMiddleware';
import jwt from 'jsonwebtoken';
import Logger from '../../../src/config/logger';

jest.mock('jsonwebtoken');
jest.mock('../../../src/config/logger');

describe('authMiddleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...OLD_ENV };
        process.env.IGNORAR_POST = '';
        mockRequest = { headers: {} };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        nextFunction = jest.fn();
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

    describe('protect', () => {
        it('deve chamar next() instantaneamente e ignorar protecao se IGNORAR_POST estiver ativado', () => {
            process.env.IGNORAR_POST = 'true';
            protect(mockRequest as Request, mockResponse as Response, nextFunction);
            
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('deve retornar 401 se nao houver o header de autorização (falta de token)', () => {
            protect(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Não autorizado, token não fornecido.' });
            expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('Tentativa de acesso sem token JWT'));
        });

        it('deve retornar 401 se o header de autorização fornecido nao vier prefixado com Bearer', () => {
            mockRequest.headers = { authorization: 'Basic token123' };
            protect(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Não autorizado, token não fornecido.' });
        });

        it('deve retornar 401 caso ocorra falha na decodificacao de um token por ser inválido', () => {
            mockRequest.headers = { authorization: 'Bearer invalid_token' };
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error('Invalid token');
            });

            protect(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(jwt.verify).toHaveBeenCalledWith('invalid_token', expect.any(String));
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Não autorizado, token inválido.' });
            expect(Logger.error).toHaveBeenCalled();
        });

        it('deve repassar adiante com next() se for recebido um JWT plenamente válido', () => {
            mockRequest.headers = { authorization: 'Bearer valid_token' };
            (jwt.verify as jest.Mock).mockImplementation(() => ({ id: 1 }));

            protect(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(jwt.verify).toHaveBeenCalledWith('valid_token', expect.any(String));
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });
});
