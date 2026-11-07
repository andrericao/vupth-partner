import { api } from "@lib/api";
import { isoDate } from "@lib/time";

// abrir-agenda (DEC-130, contrato do Backend 82915ac): o profissional abre os
// dias da agenda um a um ou repete a semana padrao, ate 31 dias. Nada amarra:
// pode abrir so alguns dias. Quem desenha os dots e o componente AbrirAgenda.

export const DIAS_PARA_ABRIR = 31;

export type DiaDaAgenda = {
  date: string;
  closed: boolean;
  opens: string | null;
  closes: string | null;
  storeOpen: boolean;
  openedByMe: boolean;
  /** abrir-dia-sem-semana (BAK-9): falso = o dia abriu, mas so chegam solicitacoes. */
  agendaReleased: boolean;
};

/** GET /professional/me/agenda: os dias de hoje ate `to` (no maximo 31 dias). */
export async function buscarAgendaAberta(from: string, to: string): Promise<DiaDaAgenda[]> {
  const { data } = await api.get("/professional/me/agenda", { params: { from, to } });
  return (data?.days ?? []).map((d: any) => ({
    date: d.date,
    closed: !!d.closed,
    opens: d.opens ?? null,
    closes: d.closes ?? null,
    storeOpen: d.store_open !== false,
    openedByMe: !!d.opened_by_me,
    agendaReleased: d.agenda_released !== false,
  }));
}

/** POST /professional/me/hours/open com dias soltos (tudo ou nada). */
export async function abrirDias(dias: DiaDaAgenda[]): Promise<void> {
  await api.post("/professional/me/hours/open", {
    dates: dias.map((d) => ({ date: d.date, opens: d.opens, closes: d.closes })),
  });
}

/** POST /professional/me/hours/open copiando a semana cadastrada, de `from` a `to`. */
export async function repetirAgendaPadrao(from: string, to: string): Promise<void> {
  await api.post("/professional/me/hours/open", { repeat_default: true, from, to });
}

/** A janela que o Partner pede: de hoje a hoje + 30 dias (31 dias no total). */
export function janelaDeAbertura(hoje: Date): { from: string; to: string } {
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + DIAS_PARA_ABRIR - 1);
  return { from: isoDate(hoje), to: isoDate(fim) };
}

/** Um dia so pode ser aberto se a loja abre, o horario vale e ele ainda nao abriu. */
export function podeAbrir(d: DiaDaAgenda): boolean {
  return d.storeOpen && !d.closed && !!d.opens && !!d.closes && !d.openedByMe;
}

/**
 * O aviso da vespera (DEC-130): no domingo, sem nenhum dia aberto por ele na
 * semana que comeca na segunda. Mesma regra do push AGENDA_NOT_OPEN do Backend
 * (domingo 10h): so conta o dia que o PROPRIO profissional abriu.
 */
export function faltaAbrirProximaSemana(hoje: Date, dias: DiaDaAgenda[]): boolean {
  if (hoje.getDay() !== 0) return false;
  const segunda = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
  const domingo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 7);
  const de = isoDate(segunda);
  const ate = isoDate(domingo);
  return !dias.some((d) => d.openedByMe && d.date >= de && d.date <= ate);
}
