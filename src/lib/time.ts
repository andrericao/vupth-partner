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

/** "HH:mm[:ss]±offset" da API -> "HH:MM" (relogio de parede). null se invalido. */
export function parseApiTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = /^(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  const hhmm = `${m[1]}:${m[2]}`;
  return isValidTime(hhmm) ? hhmm : null;
}

/** "HH:MM" -> OffsetTime UTC "HH:MM:00Z" para enviar a API. null se invalido. */
export function toApiTime(value: string): string | null {
  if (!isValidTime(value)) return null;
  return `${value}:00Z`;
}
