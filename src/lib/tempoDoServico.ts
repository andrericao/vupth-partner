// Tempo de cada servico em minutos (`estimatedMinutes`). O backend usa o valor
// na previsao da fila e grava 30 quando o app nao manda nada (ServiceItem).
export const MINUTOS_PADRAO = 30;
const MIN = 5;
const MAX = 480;

export function mascaraMinutos(texto: string): string {
  return texto.replace(/\D/g, "").slice(0, 3);
}

/** Minutos validos (5 a 480) ou null. */
export function lerMinutos(texto: string): number | null {
  const n = parseInt(texto, 10);
  if (isNaN(n) || n < MIN || n > MAX) return null;
  return n;
}
