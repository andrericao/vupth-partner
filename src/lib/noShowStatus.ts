import { api } from "@lib/api";

// atraso-na-fila-vazia-partner (DEC-101, Backend 4ca782e): "Nao compareceu" so
// vale depois de 10 min de atraso. O Backend diz se ja pode e quanto falta.
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

/** Sem resposta (ainda carregando ou falhou), nao libera o botao. */
export function podeMarcarFalta(s?: NoShowStatus | null): boolean {
  return s?.can_mark_no_show === true;
}

/** "Disponível em 4 min", quando falta tempo; nulo se ja pode ou nao ha contagem. */
export function contagemDaFalta(s?: NoShowStatus | null): string | null {
  const falta = s?.seconds_left;
  if (!s || s.can_mark_no_show || typeof falta !== "number" || falta <= 0) return null;
  const min = Math.ceil(falta / 60);
  return `“Não compareceu” libera em ${min} min`;
}
