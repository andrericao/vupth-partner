// Card enxuto da fila (2026-07-14): o menu ⋮ segue a POSICAO, nao o status.
// - 1o da vez: "Iniciar" (botao) + ⋮ [Nao chegou (atrasa), Remover]
// - demais:    ⋮ [Adiantar, Promover, Remover]
// "Atrasado" e so um selo no card; nao muda o menu. Sem escalonamento:
// atrasar e ilimitado e Remover nao exige LATE antes (nao ha "nao compareceu").
// "Adiantar" inicia o atendimento na hora (/start); "Promover" (S4, backend
// 2026-07-18) so reordena ao 1o lugar SEM iniciar (/promote).

export type QueueAction = "iniciar" | "adiantar" | "promover" | "nao-chegou" | "remover";

/**
 * Acoes do menu do card, por POSICAO.
 *
 * "Iniciar" aparece p/ o 1o desde 2026-08-11 (pedido do Andre) — **redundante
 * com o botao do rodape de proposito**: quem abre o menu do proximo espera
 * poder inicia-lo dali, em vez de fechar o menu e procurar o botao. Para os
 * demais ele continua FORA: a regra atende-primeiro nao admite iniciar do meio
 * da fila (p/ isso existe "Adiantar", que troca a posicao antes de iniciar).
 */
export function queueMenuActions(isFirst: boolean): QueueAction[] {
  return isFirst
    ? ["iniciar", "nao-chegou", "remover"]
    : ["adiantar", "promover", "remover"];
}

export const QUEUE_ACTION_LABEL: Record<QueueAction, string> = {
  iniciar: "Iniciar atendimento",
  adiantar: "Adiantar",
  promover: "Promover ao topo",
  "nao-chegou": "Não chegou",
  remover: "Remover",
};

/** Resumo dos servicos para o card (ex.: "Corte + Barba"). */
export function formatServices(services: { customName: string }[]): string {
  return services.map((s) => s.customName).join(" + ");
}
