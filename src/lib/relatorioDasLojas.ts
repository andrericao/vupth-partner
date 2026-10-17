import { isoDate } from "@lib/time";

// multi-loja-do-dono (Andre, 15/10): o relatorio do dono com todas as lojas
// juntas ou uma so, por Hoje, 7 dias, 30 dias, Mes ou periodo personalizado.
// Contrato do Backend (677cb73, multas em 20bf19d): GET /owner/me/reports.

export type PeriodoDasLojas = "hoje" | "7dias" | "30dias" | "mes" | "custom";

export const PERIODOS_DAS_LOJAS: { key: PeriodoDasLojas; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "7dias", label: "7 dias" },
  { key: "30dias", label: "30 dias" },
  { key: "mes", label: "Mês" },
  { key: "custom", label: "Personalizado" },
];

export type ResumoDasLojas = {
  finished: number;
  cancelled: number;
  gross_revenue: number;
  professionals_net: number;
  gateway_fee: number;
  app_fee: number;
  // `penalties` (Backend 20bf19d) existe mas NAO se mostra: a multa e do app
  // (DEC-83); o dono e o profissional veem so o registro e o motivo.
};

export type RelatorioDasLojas = {
  total: ResumoDasLojas;
  stores: { id: string; name: string; summary: ResumoDasLojas }[];
  series: { from: string; summary: ResumoDasLojas }[];
};

/** "dd/mm/aaaa" -> "aaaa-mm-dd"; data que nao existe volta null. */
export function dataBrParaIso(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return null;
  const [d, mes, a] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(a, mes - 1, d);
  if (dt.getFullYear() !== a || dt.getMonth() !== mes - 1 || dt.getDate() !== d) return null;
  return isoDate(dt);
}

/** O intervalo (inclusivo) do periodo; personalizado invalido ou invertido volta null. */
export function intervaloDasLojas(
  periodo: PeriodoDasLojas,
  custom: { de: string; ate: string },
  agora: Date = new Date()
): { dateFrom: string; dateTo: string } | null {
  const to = new Date(agora);
  const from = new Date(agora);
  if (periodo === "custom") {
    const de = dataBrParaIso(custom.de);
    const ate = dataBrParaIso(custom.ate);
    return de && ate && de <= ate ? { dateFrom: de, dateTo: ate } : null;
  }
  if (periodo === "7dias") from.setDate(from.getDate() - 6);
  else if (periodo === "30dias") from.setDate(from.getDate() - 29);
  else if (periodo === "mes") from.setDate(1);
  return { dateFrom: isoDate(from), dateTo: isoDate(to) };
}

/** Dia ate 31 dias, semana ate ~4 meses, mes alem disso: poucas linhas na tela. */
export function agruparPor(dateFrom: string, dateTo: string): "day" | "week" | "month" {
  const dias =
    (new Date(`${dateTo}T00:00:00`).getTime() - new Date(`${dateFrom}T00:00:00`).getTime()) /
      86400000 +
    1;
  return dias <= 31 ? "day" : dias <= 120 ? "week" : "month";
}

/** O caminho com o `establishmentId` repetido (uma loja so, ou nenhum = todas). */
export function caminhoDoRelatorio(
  dateFrom: string,
  dateTo: string,
  lojaId: string | null
): string {
  const q = [`dateFrom=${dateFrom}`, `dateTo=${dateTo}`, `groupBy=${agruparPor(dateFrom, dateTo)}`];
  if (lojaId) q.push(`establishmentId=${encodeURIComponent(lojaId)}`);
  return `/owner/me/reports?${q.join("&")}`;
}

export function reais(valor: number | null | undefined): string {
  return `R$ ${Number(valor ?? 0).toFixed(2)}`;
}

/** "2026-10-17" -> "17/10" (a linha da serie). */
export function diaMes(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
