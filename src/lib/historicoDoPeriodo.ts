import { periodRange } from "@lib/time";

/**
 * Parametros do historico do Meu dia: o profissional, o status escolhido e o
 * MESMO periodo do resumo. Sem datas, o GET /attendances devolvia a vida
 * inteira do profissional a cada foco da aba (desempenho, Andre 25/09).
 */
export function paramsDoHistorico(
  professionalId: string,
  filtro: string,
  periodo: "day" | "week" | "month",
  agora: Date = new Date()
): Record<string, string> {
  const params: Record<string, string> = { professionalId, ...periodRange(periodo, agora) };
  if (filtro !== "ALL") params.status = filtro;
  return params;
}
