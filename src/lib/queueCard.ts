// Card enxuto da fila (2026-07-14): o menu ⋮ segue a POSICAO, nao o status.
// - 1o da vez: "Iniciar" (botao) + ⋮ [Nao chegou (atrasa), Remover]
// - demais:    ⋮ [Adiantar, Promover, Remover]
// "Atrasado" e so um selo no card; nao muda o menu. Sem escalonamento:
// atrasar e ilimitado e Remover nao exige LATE antes (nao ha "nao compareceu").
// "Adiantar" inicia o atendimento na hora (/start); "Promover" (S4, backend
// 2026-07-18) so reordena ao 1o lugar SEM iniciar (/promote).

export type QueueAction =
  | "iniciar"
  | "adiantar"
  | "promover"
  | "nao-chegou"
  | "remover"
  | "finalizar"
  | "pausar"
  | "retomar";

/**
 * Acoes do menu do card, por POSICAO.
 *
 * "Iniciar" aparece p/ o 1o desde 2026-08-11 (pedido do Andre) — **redundante
 * com o botao do rodape de proposito**: quem abre o menu do proximo espera
 * poder inicia-lo dali, em vez de fechar o menu e procurar o botao. Para os
 * demais ele continua FORA: a regra atende-primeiro nao admite iniciar do meio
 * da fila (p/ isso existe "Adiantar", que troca a posicao antes de iniciar).
 */
export function queueMenuActions(isFirst: boolean, status?: string | null): QueueAction[] {
  // 🔴 O menu foi desenhado por POSICAO, e por isso nunca contemplou quem JA
  // ESTA SENDO ATENDIDO: as cinco acoes originais sao todas sobre quem espera.
  // Quem esta na cadeira nao tinha entrada nenhuma aqui — e era exatamente por
  // este menu que o Andre tentava finalizar (09/09). Nenhum diagnostico de dado
  // acharia isso: o botao nunca existiu para ser mostrado.
  if (status === "IN_PROGRESS" || status === "PAUSED") {
    return ["finalizar", status === "PAUSED" ? "retomar" : "pausar", "remover"];
  }

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
  finalizar: "Finalizar atendimento",
  pausar: "Pausar atendimento",
  retomar: "Retomar atendimento",
};

/** Resumo dos servicos para o card (ex.: "Corte + Barba"). */
export function formatServices(services: { customName: string }[]): string {
  return services.map((s) => s.customName).join(" + ");
}

/**
 * O que acontece ao marcar "Nao chegou" — regra do backend de 26/09
 * (e328629): atraso 1 e 2 trocam de lugar com o proximo; no 3o o cliente leva
 * multa de R$ 5,00 e vai para o fim da fila. O app nao sabe em qual atraso o
 * cliente esta, entao diz a regra inteira.
 */
export function mensagemDoAtraso(nome: string): string {
  return `${nome} troca de lugar com o próximo e continua na fila. No 3º atraso, vai para o fim da fila e leva multa de R$ 5,00. Continuar?`;
}
