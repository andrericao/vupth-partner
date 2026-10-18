import { parseApiTime, hhmmFromIso } from "@lib/time";
import { MINUTOS_PADRAO } from "@lib/tempoDoServico";
import { mealName } from "@store/interval.store";

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

// ---------------------------------------------------------------------------
// Refeicoes — Modelo B (janela flexivel, spec de 28/06; Backend b728005).
// O backend e a fonte da verdade: ele decide a supressao (passou do inicio
// maximo sem iniciar -> `suppressedToday`) e qual refeicao o "iniciar" comeca
// (`/next/start`). O front so esconde a suprimida e pergunta adiantar/adiar.

/** Quanto a refeicao pode comecar ANTES do alvo (inicioMin = alvo - isto). */
export const ADIANTAMENTO_MAX_MIN = 15;

/** As refeicoes que ainda contam hoje — a suprimida some do dia. */
export function refeicoesDoDia<T extends { suppressedToday?: boolean | null }>(meals: T[]): T[] {
  return meals.filter((m) => m.suppressedToday !== true);
}

/**
 * O titulo da pergunta da refeicao: "Hora do almoço" / "Hora da janta". A Janta
 * e feminina: o titulo montado como `Hora do ${nome}` saia "Hora do Janta".
 * Outro nome (refeicao criada pelo profissional) usa "Hora de", que serve aos
 * dois generos.
 */
export function tituloDaRefeicao(description: string): string {
  const nome = mealName(description);
  if (nome === "Almoço") return "Hora do almoço";
  if (nome === "Janta") return "Hora da janta";
  return `Hora de ${nome.toLowerCase()}`;
}

/** "Almoço começou às HH:MM" ("iniciado" erraria o genero da Janta) pela hora real de inicio, ou null. */
export function rotuloRefeicaoIniciada(m: { description: string; startTime: string | null }): string | null {
  const hora = hhmmFromIso(m.startTime);
  return hora ? `${mealName(m.description)} começou às ${hora}` : null;
}

/** Duracao prevista do atendimento: soma dos servicos (padrao do backend se nao houver). */
export function duracaoDoAtendimento(att: { services: { estimatedMinutes: number }[] }): number {
  const total = att.services.reduce((soma, s) => soma + (s.estimatedMinutes > 0 ? s.estimatedMinutes : 0), 0);
  return total > 0 ? total : MINUTOS_PADRAO;
}

type RefeicaoAgendada = MealLike & { suppressedToday?: boolean | null };

/**
 * A refeicao que o atendimento que vai comecar AGORA cruzaria (fila continua,
 * sem buraco): comeca antes do alvo, termina depois dele, e ja estamos dentro
 * do adiantamento permitido. E o caso do popup adiantar/adiar; fora dele a
 * refeicao encaixa sozinha (ou o backend a suprime).
 */
export function refeicaoCruzada<T extends RefeicaoAgendada>(
  meals: T[],
  nowMinutes: number,
  duracaoMin: number,
  adiantamentoMax: number = ADIANTAMENTO_MAX_MIN
): T | null {
  for (const m of refeicoesDoDia(meals)) {
    if (m.status !== "SCHEDULED") continue;
    const t = parseApiTime(m.fixedStartTime);
    if (!t) continue;
    const alvo = hhmmToMinutes(t);
    if (nowMinutes < alvo && nowMinutes + duracaoMin > alvo && nowMinutes >= alvo - adiantamentoMax) return m;
  }
  return null;
}
