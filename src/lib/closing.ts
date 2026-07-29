// Auto-fechamento da loja (BUG1 / S1 fatia 5). Ao passar o `closing_time` com o
// profissional ainda em expediente, o backend fecha a fila (`accepting_new=false`)
// e manda `CLOSING_PROMPT` pelo WS pessoal (`/user/queue/notifications`), com um
// campo `graceUntil` = fim da carencia de 15min. Nao respondendo, o backend poe
// `OFF` sozinho. Aqui so a logica PURA do evento + countdown; a UI vive em
// `src/components/ClosingPrompt.tsx` e o estado efemero na ui.store.

/** Evento do WS pessoal que abre o prompt "quer fechar?". */
export function isClosingPromptEvent(type: string | null | undefined): boolean {
  return type === "CLOSING_PROMPT";
}

/**
 * Segundos restantes ate o fim da carencia (>= 0). Data ausente/invalida = 0.
 * Arredonda p/ cima para o countdown nao "pular" o ultimo segundo.
 */
export function graceSecondsRemaining(
  graceUntil: string | null | undefined,
  nowMs: number
): number {
  if (!graceUntil) return 0;
  const end = Date.parse(graceUntil);
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, Math.ceil((end - nowMs) / 1000));
}

/** Countdown "M:SS" a partir dos segundos restantes (nunca negativo). */
export function graceCountdownLabel(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
