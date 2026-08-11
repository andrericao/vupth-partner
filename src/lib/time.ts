// Utilitarios de horario (HH:MM) <-> OffsetTime da API.
//
// A API serializa OffsetTime como "HH:mm[:ss]±offset" (segundos omitidos quando
// zero, ex.: "09:00Z", "11:30Z"). Tratamos o horario como "relogio de parede"
// HH:MM e mandamos sempre com offset UTC (Z), que e o que o backend usa nos
// exemplos. O round-trip mantem o mesmo HH:MM exibido.

/** Mascara para input: digitos -> "HH:MM" (use no onChangeText). */
export function maskTime(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

/** Valida "HH:MM" com horas 00-23 e minutos 00-59. */
export function isValidTime(value: string): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return false;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59;
}

/**
 * Offset OffsetTime -> minutos com sinal. Recebe so o que o regex de
 * `parseApiTime` ja validou: "Z" ou "±HH:MM"/"±HHMM".
 */
function offsetToMinutes(off: string): number {
  if (off === "Z") return 0;
  const sign = off[0] === "-" ? -1 : 1;
  return sign * (Number(off.slice(1, 3)) * 60 + Number(off.slice(-2)));
}

/**
 * "HH:mm[:ss]±offset" da API -> "HH:MM" no RELOGIO DE PAREDE do aparelho.
 * null se invalido.
 *
 * ⚠️ QA 2026-07-24 (bug do fuso): o backend NORMALIZA o OffsetTime para UTC e
 * devolve, p/ um almoco salvo as 12:00 local (enviado "12:00:00-03:00"), o
 * valor "15:00Z". Ler o HH:MM cru mostrava 15:00 (+3h). Aqui convertemos de
 * volta ao offset do aparelho (inverso do `toApiTime`), robusto a qualquer
 * offset ecoado. Sem offset explicito, tratamos como relogio local (sem shift).
 */
export function parseApiTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = /^(\d{2}):(\d{2})(?::\d{2})?(Z|[+-]\d{2}:?\d{2})?/.exec(value);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  const wall = h * 60 + min;
  // Sem offset: e um relogio de parede local, nao mexemos.
  if (!m[3]) return `${m[1]}:${m[2]}`;
  const utc = wall - offsetToMinutes(m[3]);
  const local = utc - new Date().getTimezoneOffset();
  const norm = ((local % 1440) + 1440) % 1440; // vira o dia sem estourar
  const hh = String(Math.floor(norm / 60)).padStart(2, "0");
  const mm = String(norm % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Sufixo de offset do APARELHO no formato OffsetTime ("-03:00"; UTC vira "Z").
 * `getTimezoneOffset()` devolve minutos a SOMAR na hora local p/ chegar em UTC
 * (Brasil = +180), entao o sinal do sufixo e o INVERSO.
 */
export function deviceOffsetSuffix(now: Date = new Date()): string {
  const min = now.getTimezoneOffset();
  if (min === 0) return "Z";
  const sign = min > 0 ? "-" : "+";
  const abs = Math.abs(min);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

/**
 * "HH:MM" -> OffsetTime "HH:MM:00±hh:mm" com o offset REAL do aparelho.
 * null se invalido.
 *
 * ⚠️ QA 2026-07-23 (BUG do fuso): antes mandavamos a hora LOCAL rotulada como
 * "Z" (UTC). O backend normaliza offsets e compara com o agora em UTC, entao a
 * janela salva "08:00Z-18:00Z" valia, em hora LOCAL do Brasil (UTC-3),
 * 05:00-15:00 — a loja aparecia aberta as 6:30 e barrava cliente as 18:30
 * (era a raiz do BUG2). Mesmo veneno nas refeicoes (mesma funcao). Enviar o
 * offset verdadeiro corrige; horarios JA SALVOS com "Z" continuam deslocados
 * ate serem RE-SALVOS (ver HANDOFF).
 */
export function toApiTime(value: string): string | null {
  if (!isValidTime(value)) return null;
  return `${value}:00${deviceOffsetSuffix()}`;
}

/** Data local como "YYYY-MM-DD" (ISO) para os params dateFrom/dateTo da API. */
export function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Janela de datas (inclusiva) para o periodo dos relatorios. */
export function periodRange(
  period: "day" | "week" | "month"
): { dateFrom: string; dateTo: string } {
  const to = new Date();
  const from = new Date();
  if (period === "week") from.setDate(from.getDate() - 6);
  else if (period === "month") from.setDate(from.getDate() - 29);
  return { dateFrom: isoDate(from), dateTo: isoDate(to) };
}

/**
 * HH:MM (relogio LOCAL) a partir de um ISO completo — p/ mostrar a HORA de um
 * timestamp do backend (ex.: `created_at` da solicitacao de corte).
 *
 * Nao confundir com `parseApiTime`, que le `OffsetTime` ("HH:mm[:ss]Z") de
 * horario de funcionamento/refeicao. Aqui a entrada e data+hora, e o `Date` do
 * runtime ja converte p/ o fuso do aparelho.
 */
export function hhmmFromIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
