import { parseApiTime } from "@lib/time";

// Sinal de refeicao — usado em DOIS lugares (fonte unica):
//   1. o popup de nudge da fila (avisa uma vez por refeicao/dia);
//   2. o DOT + rotulo do menu de opcoes da fila.
//
// Andre 2026-07-20: o sinal deve acender **30min ANTES** do horario, para o
// profissional VER com antecedencia, tocar e decidir (iniciar ou nao) — antes
// so acendia depois que a hora ja tinha passado.

/** Antecedencia (min) com que a refeicao passa a aparecer no menu. */
export const MEAL_LEAD_MIN = 30;
/** Janela (min) APOS o horario previsto em que ainda vale avisar. */
export const MEAL_NUDGE_WINDOW_MIN = 45;

/** "HH:MM" -> minutos desde a meia-noite. */
export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

type MealLike = { status: string; fixedStartTime: string | null };

/**
 * Fase do sinal:
 *   "proxima" — falta pouco (dentro dos 30min de antecedencia);
 *   "agora"   — o horario ja chegou/passou, ainda na janela;
 *   null      — nada a sinalizar.
 * So conta refeicao `SCHEDULED` (uma ja ATIVA nao e pendencia) e ignora
 * horario ausente/invalido. Se houver mais de uma na janela, "agora" vence.
 */
export function mealPhase(
  meals: MealLike[],
  nowMinutes: number,
  leadMin: number = MEAL_LEAD_MIN,
  windowMin: number = MEAL_NUDGE_WINDOW_MIN
): "proxima" | "agora" | null {
  let phase: "proxima" | "agora" | null = null;

  for (const m of meals) {
    if (m.status !== "SCHEDULED") continue;
    const t = parseApiTime(m.fixedStartTime);
    if (!t) continue;
    const tMin = hhmmToMinutes(t);

    if (nowMinutes >= tMin && nowMinutes <= tMin + windowMin) return "agora";
    if (nowMinutes >= tMin - leadMin && nowMinutes < tMin) phase = "proxima";
  }

  return phase;
}

/** Ha refeicao a sinalizar (antes ou depois do horario)? Alimenta o dot. */
export function isMealDue(
  meals: MealLike[],
  nowMinutes: number,
  leadMin: number = MEAL_LEAD_MIN,
  windowMin: number = MEAL_NUDGE_WINDOW_MIN
): boolean {
  return mealPhase(meals, nowMinutes, leadMin, windowMin) !== null;
}
