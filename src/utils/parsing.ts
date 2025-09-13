// src/utils/parsing.ts

/**
 * Extrai o MIME type e os dados de uma string base64 no formato Data URL.
 * @param dataUrl A string no formato "data:image/jpeg;base64,..."
 * @returns Um objeto com mimeType e data (base64 puro) ou null se o formato for inválido.
 */
export function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match)
    return null;
  
  return {
    mimeType: match[1],
    data: match[2],
  };
}