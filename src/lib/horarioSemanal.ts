import { isValidTime } from "@lib/time";

// Horario de funcionamento POR DIA (S27). Contrato do backend (16/09):
//   GET    /establishment/{id}/hours              semana + excecoes + proximos dias
//   PUT    /establishment/{id}/hours/weekly       os 7 dias
//   PUT    /establishment/{id}/hours/dates/{data} excecao de uma data
//   DELETE /establishment/{id}/hours/dates/{data} a data volta a semana
//
// O modelo (Andre, 16/09): a semana tem os 7 dias SEMPRE definidos (horario ou
// fechado); uma data pode ter excecao; o passado e documento — so se define de
// hoje em diante. Horarios sao "HH:mm" no fuso da LOJA (nao e o OffsetTime do
// par antigo, entao nao passa pelo parseApiTime).
//
// Aqui so a parte PURA: formato, validacao e texto. A chamada mora em
// src/lib/horariosApi.ts; a tela, em app/(owner)/(tabs)/establishment-hours.tsx.

export type DiaDaSemana =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export const DIAS: { day: DiaDaSemana; nome: string }[] = [
  { day: "MONDAY", nome: "Segunda" },
  { day: "TUESDAY", nome: "Terça" },
  { day: "WEDNESDAY", nome: "Quarta" },
  { day: "THURSDAY", nome: "Quinta" },
  { day: "FRIDAY", nome: "Sexta" },
  { day: "SATURDAY", nome: "Sábado" },
  { day: "SUNDAY", nome: "Domingo" },
];

export type HorarioDoDia = { closed: boolean; opens?: string | null; closes?: string | null };
export type DiaSemanal = HorarioDoDia & { day: DiaDaSemana };
export type Excecao = HorarioDoDia & { date: string };
export type DiaResolvido = HorarioDoDia & { date: string; day: DiaDaSemana; exception: boolean };

export type HorariosDaLoja = {
  configured: boolean;
  weekly: DiaSemanal[];
  exceptions: Excecao[];
  upcoming: DiaResolvido[];
};

export function nomeDoDia(day: DiaDaSemana): string {
  return DIAS.find((d) => d.day === day)?.nome ?? day;
}

/** "08:00:00" -> "08:00"; ausente -> null. */
function hhmm(v: unknown): string | null {
  if (typeof v !== "string" || v.length < 5) return null;
  return v.slice(0, 5);
}

function horario(raw: any): HorarioDoDia {
  const closed = !!raw?.closed;
  return {
    closed,
    opens: closed ? null : hhmm(raw?.opens),
    closes: closed ? null : hhmm(raw?.closes),
  };
}

/** Le o corpo do GET (e do 200 dos PUTs). Tolera campos ausentes. */
export function normalizarHorarios(data: any): HorariosDaLoja {
  const ordem = (day: string) => DIAS.findIndex((d) => d.day === day);
  const weekly: DiaSemanal[] = (Array.isArray(data?.weekly) ? data.weekly : [])
    .filter((d: any) => ordem(d?.day) >= 0)
    .map((d: any) => ({ day: d.day, ...horario(d) }))
    .sort((a: DiaSemanal, b: DiaSemanal) => ordem(a.day) - ordem(b.day));
  const exceptions: Excecao[] = (Array.isArray(data?.exceptions) ? data.exceptions : [])
    .map((e: any) => ({ date: String(e.date), ...horario(e) }))
    .sort((a: Excecao, b: Excecao) => a.date.localeCompare(b.date));
  const upcoming: DiaResolvido[] = (Array.isArray(data?.upcoming) ? data.upcoming : []).map(
    (u: any) => ({ date: String(u.date), day: u.day, exception: !!u.exception, ...horario(u) })
  );
  return { configured: !!data?.configured, weekly, exceptions, upcoming };
}

/**
 * A semana que a tela abre para edicao. Loja sem horario ("configured: false")
 * abre com os 7 dias ABERTOS e vazios — ou com o horario unico antigo, se a
 * loja tinha um, para o dono so conferir.
 */
export function semanaInicial(
  h: HorariosDaLoja,
  legado: { opens: string; closes: string } | null
): DiaSemanal[] {
  if (h.configured && h.weekly.length === 7) return h.weekly;
  return DIAS.map((d) => ({
    day: d.day,
    closed: false,
    opens: legado?.opens ?? "",
    closes: legado?.closes ?? "",
  }));
}

/** Por que um dia nao pode ser salvo; null = pode. */
export function erroDoDia(h: HorarioDoDia): string | null {
  if (h.closed) return null;
  if (!isValidTime(h.opens ?? "")) return "informe a abertura no formato HH:MM.";
  if (!isValidTime(h.closes ?? "")) return "informe o fechamento no formato HH:MM.";
  // fechar antes de abrir = vira a meia-noite; igual = 24h. Os dois valem.
  return null;
}

export function validarSemana(dias: DiaSemanal[]): string | null {
  if (dias.length !== 7) return "A semana precisa dos 7 dias.";
  for (const d of dias) {
    const e = erroDoDia(d);
    if (e) return `${nomeDoDia(d.day)}: ${e}`;
  }
  return null;
}

// As frases sao as MESMAS do client (decisao do Andre, 17/09): o cliente e o
// profissional leem a mesma coisa sobre a mesma loja. Ver
// src/domain/establishment/horarios.ts no repo do client.
export function descreverHorario(h: HorarioDoDia): string {
  if (h.closed) return "Fechado";
  if (h.opens && h.opens === h.closes) return "24 horas";
  const base = `${h.opens} às ${h.closes}`;
  if (h.opens && h.closes && h.closes < h.opens) return `${base} (vira o dia)`;
  return base;
}

/** "Aplicar a todos": o horario vai para os dias ABERTOS; fechado continua fechado. */
export function aplicarATodos(
  dias: DiaSemanal[],
  origem: { opens: string; closes: string }
): DiaSemanal[] {
  return dias.map((d) => (d.closed ? d : { ...d, opens: origem.opens, closes: origem.closes }));
}

/** O corpo que os PUTs esperam: fechado nao leva horario. */
export function corpoDoDia(h: HorarioDoDia): HorarioDoDia {
  return h.closed ? { closed: true } : { closed: false, opens: h.opens, closes: h.closes };
}

/** "21/09/2026" -> "2026-09-21"; data incompleta ou impossivel -> null. */
export function dataBrParaIso(br: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return null;
  const [, dd, mm, aaaa] = m;
  const d = new Date(Number(aaaa), Number(mm) - 1, Number(dd));
  if (d.getFullYear() !== Number(aaaa) || d.getMonth() !== Number(mm) - 1 || d.getDate() !== Number(dd)) {
    return null;
  }
  return `${aaaa}-${mm}-${dd}`;
}

export function isoParaBr(iso: string): string {
  const [aaaa, mm, dd] = iso.split("-");
  return `${dd}/${mm}/${aaaa}`;
}

/** Hoje no relogio do aparelho, "AAAA-MM-DD". */
export function hojeIso(agora: Date = new Date()): string {
  const mm = String(agora.getMonth() + 1).padStart(2, "0");
  const dd = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mm}-${dd}`;
}

/**
 * O dono ja definiu o horario? Com a semana do backend, vale o `configured`:
 * o `opening_time` agora e o horario DE HOJE e vem nulo no dia em que a loja
 * fecha — olhar so ele acusaria "falta o horario" todo domingo. Sem a semana
 * (backend antigo), cai no par unico.
 */
export function temHorarioDefinido(
  semana: { configured: boolean } | null,
  loja: { opening_time?: string | null; closing_time?: string | null } | null
): boolean {
  if (semana) return semana.configured;
  return !!loja?.opening_time && !!loja?.closing_time;
}

/** O dia seguinte a uma data ISO, em ISO. */
function amanhaDe(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  const dt = new Date(a, m - 1, d + 1);
  return hojeIso(dt);
}

/**
 * O horario de HOJE da loja, para a tela que o profissional ve antes de pedir
 * vinculo — e as MESMAS frases do client (mandadas por eles em 17/09), porque o
 * cliente e o profissional leem a mesma coisa sobre a mesma loja.
 *
 * `null` quando a loja ainda nao definiu horario (`configured: false`) ou quando
 * hoje nao esta em `upcoming`: melhor nao dizer nada do que chutar pela semana,
 * que ignoraria uma excecao de data.
 *
 * O "reabre" so le `upcoming` (dias JA RESOLVIDOS pelo backend). Deduzir da
 * semana prometeria um sabado que a excecao fechou.
 */
export function resumoDoDia(
  h: HorariosDaLoja,
  hoje: string
): { hoje: string; reabre: string | null } | null {
  if (!h.configured) return null;
  const doDia = h.upcoming.find((u) => u.date === hoje);
  if (!doDia) return null;

  if (!doDia.closed) return { hoje: `Hoje, ${descreverHorario(doDia)}`, reabre: null };

  const proximoAberto = h.upcoming.find((u) => u.date > hoje && !u.closed && u.opens);
  if (!proximoAberto) return { hoje: "Fechada hoje", reabre: null };

  const quando =
    proximoAberto.date === amanhaDe(hoje) ? "amanhã" : nomeDoDia(proximoAberto.day).toLowerCase();
  return { hoje: "Fechada hoje", reabre: `Reabre ${quando}, ${proximoAberto.opens}` };
}
