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
  return names.length > 0 ? names.join(" + ") : "Serviço não identificado";
}

/**
 * Titulo do card do pedido. Usa o `client_name` quando o backend enviar
 * (nice-to-have ja cobrado); ate la, "Cliente" — o card nunca fica sem titulo.
 */
export function cutRequestTitle(
  req: { client_name?: string | null; service_item_ids: string[] },
  myServices: { id: string; customName: string }[]
): string {
  const who = req.client_name?.trim() || "Cliente";
  return `${who} quer: ${cutRequestServices(req.service_item_ids, myServices)}`;
}

/**
 * Nome do cliente do pedido, isolado do restante do titulo — usado na tela
 * "Encaixes" (Pencil), que mostra nome e servico em linhas separadas em vez
 * do "Fulano quer: X" corrido do bottom-sheet. Mesmo fallback de cutRequestTitle.
 */
export function cutRequestClientName(req: { client_name?: string | null }): string {
  return req.client_name?.trim() || "Cliente";
}

/**
 * Soma dos precos dos servicos do pedido, resolvidos contra os servicos do
 * PROPRIO profissional (mesma fonte/invariante de cutRequestServices). Id
 * desconhecido conta como 0 em vez de quebrar a soma — mostrar um total
 * menor que o real e mais seguro do que travar o card.
 */
export function cutRequestTotal(
  serviceItemIds: string[],
  myServices: { id: string; price: number }[]
): number {
  return serviceItemIds.reduce((sum, id) => {
    const item = myServices.find((s) => s.id === id);
    return sum + (item?.price ?? 0);
  }, 0);
}

/**
 * Eventos do WS pessoal (`/user/queue/notifications`) que devem re-buscar a
 * lista de pedidos. Prefixo `CUT_` cobre CUT_REQUESTED (o unico dirigido ao
 * profissional hoje) e qualquer evento de corte futuro sem retocar o hook.
 */
export function isCutRequestEvent(type: string | null | undefined): boolean {
  return !!type && type.startsWith("CUT_");
}
