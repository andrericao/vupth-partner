// Contagem de notificacoes do menu da fila (Andre 2026-08-05: "um dot no menu
// da fila com a numeracao de 1 a 9+ caso sejam mais de 9 notificacoes; dentro
// dos menus devem existir outros dots para levar o profissional ao local").
//
// Regra de ouro: o badge de FORA so conta o que tem um dot DENTRO do menu —
// senao o profissional abre o menu e nao acha o que estava piscando. Pendencia
// de cadastro NAO entra aqui: ela tem dot proprio na aba Configuracoes.

const MAX_SHOWN = 9;

/** Rotulo do badge: "" (nao mostrar), "1".."9" ou "9+". */
export function badgeLabel(count: number): string {
  if (!(count >= 1)) return ""; // cobre 0, negativo e NaN
  if (count > MAX_SHOWN) return `${MAX_SHOWN}+`;
  return String(Math.floor(count));
}

type QueueMenuPending = {
  /** Solicitacoes de corte pendentes (cada uma e uma notificacao). */
  pendingRequests?: number;
  /** Refeicao sinalizando (proxima ou na hora) — vale UMA notificacao. */
  mealPending?: boolean;
};

/** Total de notificacoes que o menu da fila resolve. */
export function queueMenuCount({ pendingRequests, mealPending }: QueueMenuPending): number {
  const requests = Number.isFinite(pendingRequests) ? Math.max(0, Math.floor(pendingRequests!)) : 0;
  return requests + (mealPending ? 1 : 0);
}
