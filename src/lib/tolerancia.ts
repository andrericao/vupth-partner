import { api } from "@lib/api";

// menu-da-fila-nao-chegou-tolerancia (Andre, 24/10): o cliente tem 10 minutos de
// tolerancia depois da hora. O Backend diz quanto falta (GET .../no-show-status,
// relogio do servidor); o app so mostra. Dentro da tolerancia, sozinho na fila, o
// "Nao chegou" fica desativado e avisa.
export type NoShowStatus = {
  attendance_id: string;
  is_first: boolean;
  can_mark_no_show: boolean;
  reason?: "NOT_FIRST" | "TOO_EARLY" | null;
  available_at?: string | null;
  seconds_left?: number | null;
  wait_minutes?: number;
};

export async function buscarNoShowStatus(attendanceId: string): Promise<NoShowStatus> {
  const { data } = await api.get<NoShowStatus>(`/attendances/${attendanceId}/no-show-status`);
  return data;
}

const MINUTOS_PADRAO = 10;

/** Ainda dentro da tolerancia: o Backend disse TOO_EARLY e ainda faltam segundos. */
export function dentroDaTolerancia(s?: NoShowStatus | null): boolean {
  return !!s && s.reason === "TOO_EARLY" && typeof s.seconds_left === "number" && s.seconds_left > 0;
}

/** O aviso ao tocar no "Nao chegou" desativado. */
export function avisoDaTolerancia(s?: NoShowStatus | null): string {
  return `Tem ${s?.wait_minutes ?? MINUTOS_PADRAO} minutos de tolerância.`;
}

/** A faixa do menu (com outros na fila): quanto falta da tolerancia. Nulo fora dela. */
export function faixaDaTolerancia(s?: NoShowStatus | null): string | null {
  if (!dentroDaTolerancia(s)) return null;
  const min = Math.ceil((s!.seconds_left as number) / 60);
  return `Tolerância de ${s?.wait_minutes ?? MINUTOS_PADRAO} minutos: faltam ${min} min`;
}
