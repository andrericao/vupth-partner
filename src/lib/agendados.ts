import { api } from "@lib/api";
import { isoDate, hhmmFromIso } from "@lib/time";
import type { AttendanceHistoryItem } from "@lib/types";

// agenda-do-profissional-partner: o que o profissional tem marcado nos proximos
// dias. Contrato do Backend: GET /attendances?professionalId=&dateFrom=&dateTo=
// &status=SCHEDULED&size=100 (hoje ate hoje+7).
export const DIAS_A_FRENTE = 7;

export function paramsDosAgendados(professionalId: string, agora: Date = new Date()) {
  const ate = new Date(agora);
  ate.setDate(ate.getDate() + DIAS_A_FRENTE);
  return {
    professionalId,
    dateFrom: isoDate(agora),
    dateTo: isoDate(ate),
    status: "SCHEDULED",
    page: 0,
    size: 100,
  };
}

export async function buscarAgendados(professionalId: string, agora: Date = new Date()) {
  const { data } = await api.get("/attendances", { params: paramsDosAgendados(professionalId, agora) });
  const itens: AttendanceHistoryItem[] = Array.isArray(data) ? data : (data?.items ?? []);
  return itens;
}

export type DiaAgendado = { dia: string; titulo: string; itens: AttendanceHistoryItem[] };

/** "Hoje", "Amanhã" ou "qua., 24/10", conforme a distancia de `agora`. */
export function tituloDoDia(dia: string, agora: Date = new Date()): string {
  const hoje = isoDate(agora);
  const amanha = new Date(agora);
  amanha.setDate(amanha.getDate() + 1);
  if (dia === hoje) return "Hoje";
  if (dia === isoDate(amanha)) return "Amanhã";
  const [a, m, d] = dia.split("-").map(Number);
  const nome = new Date(a, m - 1, d).toLocaleDateString("pt-BR", { weekday: "short" });
  return `${nome} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

/** Agrupa por dia (local) e ordena pelo horario; dias sem agendamento nao aparecem. */
export function agruparPorDia(itens: AttendanceHistoryItem[], agora: Date = new Date()): DiaAgendado[] {
  const validos = itens
    .filter((i) => i.scheduledTime && !Number.isNaN(new Date(i.scheduledTime).getTime()))
    .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  const mapa = new Map<string, AttendanceHistoryItem[]>();
  for (const i of validos) {
    const dia = isoDate(new Date(i.scheduledTime));
    mapa.set(dia, [...(mapa.get(dia) ?? []), i]);
  }
  return [...mapa.entries()].map(([dia, lista]) => ({ dia, titulo: tituloDoDia(dia, agora), itens: lista }));
}

export function horaDoAgendado(i: AttendanceHistoryItem): string {
  return hhmmFromIso(i.scheduledTime) ?? "--:--";
}
