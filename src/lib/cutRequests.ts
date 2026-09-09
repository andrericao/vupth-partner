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

/**
 * Resumo dos pedidos pendentes para o card da FILA.
 *
 * Item 1 da lista de defeitos, aberto desde 05/08: o pedido chega, mas so
 * acende um ponto de 12px dentro do menu ☰ — "solicitei corte e nada apareceu
 * na tela do profissional". Em 07/09 a decisao de que FILA FECHADA CONTINUA
 * ACEITANDO SOLICITACAO transformou esse canal no UNICO caminho do cliente
 * para quem nao esta de expediente. Um ponto de 12px, ai, e pedido perdido.
 *
 * O resumo responde as tres perguntas que decidem se o profissional larga o
 * que esta fazendo: QUANTOS, QUEM e QUANTO TEMPO RESTA. O relogio e o do mais
 * urgente porque o TTL e de 5 minutos e a decisao e por pedido — mostrar a
 * media, ou o primeiro da lista, esconderia justamente o que vai expirar.
 *
 * `null` quando nao ha nada pendente: ausencia de card e o estado correto, e
 * card vazio na tela mais cheia do app so gasta espaco.
 */
export type ResumoSolicitacoes = {
  titulo: string;
  quem: string;
  /** Minutos ate o MAIS urgente expirar. */
  expiraEm: number;
};

export function resumoDeSolicitacoes(
  list: CutRequestResponse[] | null | undefined,
  nowMs: number
): ResumoSolicitacoes | null {
  const ativos = activeCutRequests(list, nowMs);
  if (ativos.length === 0) return null;

  const primeiro = cutRequestClientName(ativos[0]);
  const outros = ativos.length - 1;

  return {
    titulo: `${ativos.length} ${ativos.length === 1 ? "solicitação" : "solicitações"} de encaixe`,
    quem: outros > 0 ? `${primeiro} e mais ${outros}` : primeiro,
    expiraEm: Math.min(...ativos.map((r) => minutesToExpire(r.expires_at, nowMs))),
  };
}
