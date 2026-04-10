import { ValidationError } from '../../../src/errors/ValidationError';

describe('ValidationError', () => {
    it('deve criar corretamente a instância da classe ValidationError com as propriedades esperadas', () => {
        const mensagemErro = 'Mensagem de erro customizada';
        const error = new ValidationError(mensagemErro);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe(mensagemErro);
        expect(error.name).toBe('ValidationError');
    });
});
