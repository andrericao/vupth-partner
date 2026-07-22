import type { CutRequestResponse } from "@lib/types";

// Solicitacoes de corte (C2) — logica PURA da lista de pendentes.
// O backend expira o pedido em 5min server-side (CUT_EXPIRED vai ao CLIENTE);
// a orientacao deles p/ o partner e expirar a UI LOCALMENTE pelo `expires_at`
// ja recebido — por isso o filtro aqui e por status E validade.

/** Pedidos que ainda merecem decisao: PENDING e dentro da validade. */
export function activeCutRequests(
  list: CutRequestResponse[] | null | undefined,
  nowMs: number
): CutRequestResponse[] {
  if (!list) return [];
  return list.filter((r) => {
    if (r.status !== "PENDING") return false;
    const expires = Date.parse(r.expires_at);
    return Number.isFinite(expires) && expires > nowMs;
  });
}

/** Minutos restantes ate expirar (>= 0; data invalida conta como 0). */
export function minutesToExpire(expiresAt: string, nowMs: number): number {
  const expires = Date.parse(expiresAt);
  if (!Number.isFinite(expires)) return 0;
  return Math.max(0, Math.ceil((expires - nowMs) / 60000));
}

/**
 * Nomes dos servicos do pedido, resolvidos contra os servicos do PROPRIO
 * profissional (o response so traz `service_item_ids`; os itens sao sempre
 * dele — invariante do backend). Id desconhecido e ignorado; lista vazia
 * ganha um rotulo generico p/ o card nao ficar em branco.
 */
export function cutRequestServices(
  serviceItemIds: string[],
  myServices: { id: string; customName: string }[]
): string {
  const names = serviceItemIds
    .map((id) => myServices.find((s) => s.id === id)?.customName)
    .filter((n): n is string => !!n);
  return names.length > 0 ? names.join(" + ") : "Servico nao identificado";
}
