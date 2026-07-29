import { parseApiTime } from "@lib/time";

// Sinal de refeicao. Andre 2026-07-20:
//   - acende **30min ANTES** do horario (dar tempo de decidir);
//   - **SEM intromissao na tela**: a informacao vive no menu (dot + contagem
//     regressiva), nao em popup.
// O popup de nudge continua existindo, mas ganhou "Nao ver mais" (ver
// queue.tsx / settings.tsx) — quem desliga fica so com o dot.

/** Antecedencia (min) com que a refeicao passa a aparecer no menu. */
export const MEAL_LEAD_MIN = 30;
/** Janela (min) APOS o horario previsto em que ainda vale sinalizar. */
export const MEAL_NUDGE_WINDOW_MIN = 45;

/** "HH:MM" -> minutos desde a meia-noite. */
export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

type MealLike = { status: string; fixedStartTime: string | null };

export type MealSignal = {
  /** "proxima" = ainda vai comecar; "agora" = ja passou do horario. */
  phase: "proxima" | "agora";
  /** Minutos ATE o horario. Positivo em "proxima"; <= 0 em "agora". */
  minutesUntil: number;
};

/**
 * Sinal da refeicao mais relevante, ou null.
 * Regras: so conta `SCHEDULED` (uma ja ATIVA nao e pendencia); ignora horario
 * ausente/invalido; **"agora" tem prioridade** sobre "proxima" (a que ja passou
 * e mais urgente); havendo duas "proxima", vence a mais perto.
 */
export function mealSignal(
  meals: MealLike[],
  nowMinutes: number,
  leadMin: number = MEAL_LEAD_MIN,
  windowMin: number = MEAL_NUDGE_WINDOW_MIN
): MealSignal | null {
  let upcoming: MealSignal | null = null;

  for (const m of meals) {
    if (m.status !== "SCHEDULED") continue;
    const t = parseApiTime(m.fixedStartTime);
    if (!t) continue;

    const delta = hhmmToMinutes(t) - nowMinutes;

    if (delta <= 0 && -delta <= windowMin) return { phase: "agora", minutesUntil: delta };
    if (delta > 0 && delta <= leadMin && (!upcoming || delta < upcoming.minutesUntil)) {
      upcoming = { phase: "proxima", minutesUntil: delta };
    }
  }

  return upcoming;
}

/** Ha refeicao a sinalizar (antes ou depois do horario)? Alimenta o dot. */
export function isMealDue(
  meals: MealLike[],
  nowMinutes: number,
  leadMin: number = MEAL_LEAD_MIN,
  windowMin: number = MEAL_NUDGE_WINDOW_MIN
): boolean {
  return mealSignal(meals, nowMinutes, leadMin, windowMin) !== null;
}
