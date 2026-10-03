// Expediente nos relatorios (contrato do Backend de 03/10, BAK-1): os dois
// relatorios trazem `workdays`, um item por dia com a primeira entrada (start),
// a ultima saida (end — null enquanto alguem segue em expediente) e os minutos
// trabalhados. Nada e retroativo: dia sem dado fica no placeholder.
import type { Periodo } from "@hooks/useRelatorioDoPeriodo";
import { parseApiTime } from "@lib/time";

export type DiaDeExpediente = {
  date: string;
  start: string | null;
  end: string | null;
  workedMinutes: number;
};

export type ResumoDoExpediente = { valor: string; detalhe?: string };

/** Data-hora ISO ou horario solto da API -> "HH:MM" no relogio do aparelho. */
export function horaDoTurno(valor: string | null | undefined): string | null {
  if (!valor) return null;
  if (!valor.includes("T")) return parseApiTime(valor);
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function duracao(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  return `${Math.floor(minutos / 60)}h${String(minutos % 60).padStart(2, "0")}`;
}

/**
 * Hoje: a faixa "HH:MM–HH:MM" do dia ("–agora" com alguem em expediente).
 * Semana/Mes: o total trabalhado e em quantos dias. null = sem expediente.
 */
export function resumoDoExpediente(
  workdays: DiaDeExpediente[] | null | undefined,
  periodo: Periodo
): ResumoDoExpediente | null {
  const dias = (workdays ?? []).filter((d) => horaDoTurno(d.start));
  if (dias.length === 0) return null;

  if (periodo === "day") {
    const hoje = dias[dias.length - 1];
    return { valor: `${horaDoTurno(hoje.start)}–${horaDoTurno(hoje.end) ?? "agora"}` };
  }

  const total = dias.reduce((soma, d) => soma + d.workedMinutes, 0);
  return { valor: duracao(total), detalhe: `em ${dias.length} ${dias.length === 1 ? "dia" : "dias"}` };
}
