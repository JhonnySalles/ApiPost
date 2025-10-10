/**
 * Converte uma string para o formato Title Case.
 * Ex: "uma frase de exemplo" -> "Uma Frase De Exemplo"
 * @param str A string a ser convertida.
 * @returns A string em Title Case.
 */
export function toTitleCase(str: string | undefined | null): string {
    // prettier-ignore
    if (!str)
        return '';
    return str.toLowerCase().replace(/(?:^|\s)\w/g, (match) => {
        return match.toUpperCase();
    });
}