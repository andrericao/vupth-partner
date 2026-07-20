import { parseApiTime } from "@lib/time";

// Regra de "refeicao na hora" — usada em DOIS lugares (fonte unica):
//   1. o popup de nudge da fila (avisa uma vez por refeicao/dia);
//   2. o DOT do menu ☰ (design Andre 2026-07-18), que fica aceso enquanto a
//      refeicao esta na janela e o profissional nao resolveu (iniciar/adiar).

/** Janela (min) apos o horario previsto em que ainda vale avisar da refeicao. */
export const MEAL_NUDGE_WINDOW_MIN = 45;

/** "HH:MM" -> minutos desde a meia-noite. */
export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

type MealLike = { status: string; fixedStartTime: string | null };

/**
 * Ha refeicao AGENDADA cujo horario ja chegou e ainda esta dentro da janela?
 * So conta `SCHEDULED` (uma refeicao ja ATIVA nao e mais pendencia) e ignora
 * horario ausente/invalido.
 */
export function isMealDue(
  meals: MealLike[],
  nowMinutes: number,
  windowMin: number = MEAL_NUDGE_WINDOW_MIN
): boolean {
  return meals.some((m) => {
    if (m.status !== "SCHEDULED") return false;
    const t = parseApiTime(m.fixedStartTime);
    if (!t) return false;
    const tMin = hhmmToMinutes(t);
    return nowMinutes >= tMin && nowMinutes <= tMin + windowMin;
  });
}
