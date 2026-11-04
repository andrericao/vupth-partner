import { api } from "@lib/api";
import { hhmmFromIso } from "@lib/time";

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

// atraso-so-apos-tolerancia (DEC-185, Backend c38ba90): o PRIMEIRO agendado do
// dia so pode ser marcado atrasado depois de horario + 10 min. O no-show-status
// nao sabe disso; o PATCH /late responde 409 LATE_TOO_EARLY com available_at, e
// o app guarda esse horario para deixar o "Nao chegou" desativado ate la.
// Iniciar antes do horario segue livre.

/** O available_at de um 409 LATE_TOO_EARLY; nulo para qualquer outro erro. */
export function liberacaoDoAtraso(error: any): string | null {
  const data = error?.response?.data;
  if (error?.response?.status !== 409 || data?.code !== "LATE_TOO_EARLY") return null;
  return typeof data.available_at === "string" && data.available_at ? data.available_at : null;
}

/** Ainda antes do horario em que o atraso libera. */
export function atrasoTravado(availableAt: string | null | undefined, agora: number): boolean {
  if (!availableAt) return false;
  const t = new Date(availableAt).getTime();
  return !Number.isNaN(t) && t > agora;
}

/** O aviso do primeiro horario do dia: a partir de quando o atraso vale. */
export function avisoDoPrimeiroDoDia(availableAt: string | null | undefined): string {
  const hora = hhmmFromIso(availableAt);
  return hora
    ? `Primeiro horário do dia: tem 10 minutos de tolerância. O atraso só pode ser marcado a partir das ${hora}.`
    : "Primeiro horário do dia: tem 10 minutos de tolerância.";
}
