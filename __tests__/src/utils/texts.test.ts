import { toTitleCase } from '../../../src/utils/texts';

describe('texts utils', () => {
    describe('toTitleCase', () => {
        it('deve converter uma string simples em letras minúsculas para Title Case', () => {
            expect(toTitleCase('uma frase de exemplo')).toBe('Uma Frase De Exemplo');
        });

        it('deve corrigir e converter uma string toda em maiúsculas', () => {
            expect(toTitleCase('UMA FRASE DE EXEMPLO')).toBe('Uma Frase De Exemplo');
        });

        it('deve manter apenas a primeira letra de cada palavra maiúscula', () => {
            expect(toTitleCase('cAsO mIsTo De lEtrAs')).toBe('Caso Misto De Letras');
        });

        it('deve retornar uma string vazia ao receber null, undefined ou vazio', () => {
            expect(toTitleCase(null)).toBe('');
            expect(toTitleCase(undefined)).toBe('');
            expect(toTitleCase('')).toBe('');
        });
    });
});
