// Exibicao da avaliacao (rating) recebida. O backend ja popula
// `rating_average`/`rating_count` por profissional em professionals-with-queue
// (#6, confirmado 2026-07-04) — o front so EXIBE. Sem avaliacao ⇒ nao mostra nada.

/** "4.8 (12)" quando ha avaliacoes; `null` quando nao ha (nao renderizar). */
export function ratingLabel(average?: number | null, count?: number | null): string | null {
  if (average == null || count == null) return null;
  if (!(count > 0) || !(average > 0)) return null;
  return `${average.toFixed(1)} (${count})`;
}
