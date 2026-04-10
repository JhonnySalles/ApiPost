import { parseDataUrl } from '../../../src/utils/parsing';

describe('parsing utils', () => {
    describe('parseDataUrl', () => {
        it('deve extrair mimeType e base64 de uma string data url corretamente', () => {
            const dataUrl = 'data:image/jpeg;base64,aabbccdd';
            const result = parseDataUrl(dataUrl);

            expect(result).not.toBeNull();
            expect(result?.mimeType).toBe('image/jpeg');
            expect(result?.data).toBe('aabbccdd');
        });

        it('deve retornar null para um formato totalmente inválido', () => {
            const dataUrl = 'invalid_format';
            expect(parseDataUrl(dataUrl)).toBeNull();
        });

        it('deve retornar null para um formato parcial sem dados', () => {
            const dataUrl = 'data:image/jpeg;base64';
            expect(parseDataUrl(dataUrl)).toBeNull();
        });
    });
});
