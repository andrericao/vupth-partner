import type { CutRequestResponse } from "@lib/types";

// Solicitacoes de corte (C2) — logica PURA da lista de pendentes.
// O backend expira o pedido em 5min server-side (CUT_EXPIRED vai ao CLIENTE);
// a orientacao deles p/ o partner e expirar a UI LOCALMENTE pelo `expires_at`
// ja recebido — por isso o filtro aqui e por status E validade.

/**
 * Pedidos que ainda merecem decisao: PENDING e dentro da validade. O de outro
 * dia vem com `expires_at` nulo (DEC-27, Backend d8039b5): nao expira.
 */
export function activeCutRequests(
  list: CutRequestResponse[] | null | undefined,
  nowMs: number
): CutRequestResponse[] {
  if (!list) return [];
  return list.filter((r) => {
    if (r.status !== "PENDING") return false;
    if (r.expires_at === null) return true;
    const expires = Date.parse(r.expires_at);
    return Number.isFinite(expires) && expires > nowMs;
  });
}

/**
 * Minutos restantes ate expirar (>= 0; data invalida conta como 0). Sem prazo
 * (pedido de outro dia) => null: nao e "expira agora".
 */
export function minutesToExpire(expiresAt: string | null, nowMs: number): number | null {
  if (expiresAt === null) return null;
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
  /** Minutos ate o MAIS urgente expirar; null = so pedidos sem prazo (outro dia). */
  expiraEm: number | null;
};

export function resumoDeSolicitacoes(
  list: CutRequestResponse[] | null | undefined,
  nowMs: number
): ResumoSolicitacoes | null {
  const ativos = activeCutRequests(list, nowMs);
  if (ativos.length === 0) return null;

  const primeiro = cutRequestClientName(ativos[0]);
  // O de outro dia fica fora do relogio: com o BAK-1 ele vence no horario
  // pedido (amanha), nao e urgente.
  const prazos = ativos
    .filter((r) => !ehDeOutroDia(r, nowMs))
    .map((r) => minutesToExpire(r.expires_at, nowMs))
    .filter((m): m is number => m !== null);
  const outros = ativos.length - 1;

  return {
    titulo: `${ativos.length} ${ativos.length === 1 ? "solicitação" : "solicitações"} de encaixe`,
    quem: outros > 0 ? `${primeiro} e mais ${outros}` : primeiro,
    expiraEm: prazos.length > 0 ? Math.min(...prazos) : null,
  };
}

/**
 * O que fazer depois de decidir um encaixe. Aceitar poe o profissional em
 * TRABALHANDO (Andre, 25/09: "quando aceitar um pedido de encaixe, seu status
 * deve mudar para trabalhando") e muda a fila. O backend diz fazer a troca
 * (26/08), mas o teste de 25/09 mostrou "Fora" depois do aceite — entao o app
 * rele o status e, se nao veio Trabalhando, pede a troca ele mesmo.
 *
 * Tudo best-effort: o aceite ja aconteceu; falha aqui nao vira erro na tela.
 */
export async function releDepoisDeDecidir(
  aceitou: boolean,
  deps: {
    releStatus: () => Promise<void>;
    statusAtual: () => string | null | undefined;
    ficarTrabalhando: () => Promise<void>;
    invalidar: (chave: string[]) => void;
  }
): Promise<void> {
  if (!aceitou) return;
  try {
    await deps.releStatus();
    if (deps.statusAtual() !== "WORKING") await deps.ficarTrabalhando();
  } catch {
    // ver acima
  }
  deps.invalidar(["professionals-with-queue"]);
  deps.invalidar(["professional-queue"]);
}

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/**
 * corte-com-horario (S26, Backend 36c4359): quando o cliente quer ser atendido,
 * pelo `desired_time` do pedido. So informa — o aceite continua pondo o cliente
 * no fim da fila. Sem horario (null), o cliente quer "assim que abrir".
 */
export function quandoOClienteQuer(
  desiredTime: string | null | undefined,
  nowMs: number
): string {
  const d = desiredTime ? new Date(desiredTime) : null;
  if (!d || Number.isNaN(d.getTime())) return "Quer assim que abrir";
  const pad = (n: number) => String(n).padStart(2, "0");
  const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const hoje = new Date(nowMs);
  hoje.setHours(0, 0, 0, 0);
  const dia = new Date(d);
  dia.setHours(0, 0, 0, 0);
  const dias = Math.round((dia.getTime() - hoje.getTime()) / 86400000);
  if (dias === 0) return `Quer hoje às ${hora}`;
  if (dias === 1) return `Quer amanhã às ${hora}`;
  return `Quer ${DIAS[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)} às ${hora}`;
}

/** O dia (meia-noite local) de um instante, em ms. */
function diaLocal(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

type PedidoComDia = { desired_time?: string | null; expires_at: string | null };

/**
 * texto-do-aceite (Backend aceite-vira-agendamento, ba38b81): o pedido para
 * outro dia vira agendamento naquele dia ao ser aceito; o de hoje entra no fim
 * da fila. pedido-vence-no-horario (BAK-1, 0f18380): o expires_at vem sempre
 * preenchido (vence no horario pedido) — o dia sai do desired_time. Sem
 * desired_time, o legado (antes do BAK-1): expires_at nulo era o de outro dia.
 */
export function ehDeOutroDia(req: PedidoComDia, nowMs: number): boolean {
  if (req.desired_time) {
    const quer = Date.parse(req.desired_time);
    return Number.isFinite(quer) && diaLocal(quer) !== diaLocal(nowMs);
  }
  return req.expires_at === null;
}

/** O que acontece ao aceitar, na linha do card. */
export function oQueAconteceAoAceitar(req: PedidoComDia, nowMs: number): string {
  return ehDeOutroDia(req, nowMs) ? "fica agendado para esse dia" : "entra no fim da sua fila";
}

/**
 * O selo do prazo no card do pedido. Ate 60 min, o relogio em minutos (urgente
 * ate 2); mais longe (BAK-1: o pedido vence no horario pedido, as vezes
 * amanha), a hora em que vence; sem vencimento (legado), "sem prazo".
 */
export function seloDoPrazo(
  expiresAt: string | null,
  nowMs: number
): { texto: string; urgente: boolean } {
  const mins = minutesToExpire(expiresAt, nowMs);
  if (mins === null) return { texto: "sem prazo", urgente: false };
  if (mins <= 60) return { texto: `${mins} min`, urgente: mins <= 2 };
  const d = new Date(expiresAt as string);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { texto: `vale até ${pad(d.getHours())}:${pad(d.getMinutes())}`, urgente: false };
}
