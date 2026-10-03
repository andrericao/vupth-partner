import { decodeToken } from "@lib/jwt";

// Autenticacao do socket STOMP — logica PURA (o wiring vive em useQueueSocket).
//
// ⚠️ Por que isto existe (estudo de infra 2026-08-01, HANDOFF_BACKEND S14):
// o access token dura 1h, mas o `connectHeaders` do stompjs era montado UMA vez,
// no mount do hook. Como o `reconnectDelay` reconecta sozinho, toda reconexao
// depois da 1a hora subia com o header VELHO — e o backend, ao receber token
// invalido, **conecta como ANONIMO em vez de recusar**. Resultado: o app ficava
// "conectado" mas parava de receber `/user/queue/notifications` PARA SEMPRE,
// sem erro em nenhuma ponta (o topico publico da fila continuava chegando, o
// que mascarava o problema).

/** Margem: renova ANTES de expirar, p/ o token nao morrer no meio da sessao. */
export const REFRESH_SKEW_MS = 2 * 60 * 1000;

/**
 * O token precisa ser renovado antes de abrir/reabrir o socket?
 * `true` quando nao ha token, quando ele e ilegivel, ou quando expira dentro
 * da margem (`skewMs`).
 */
export function needsRefresh(
  token: string | null | undefined,
  nowMs: number = Date.now(),
  skewMs: number = REFRESH_SKEW_MS
): boolean {
  if (!token) return true;
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 - nowMs <= skewMs;
}

/**
 * O backend recusou o CONNECT por token invalido (frame ERROR com
 * `message: INVALID_TOKEN`, C16)? Ai a proxima tentativa renova o token mesmo
 * que o `exp` ainda nao tenha chegado (ex.: token revogado) — sem isso o
 * `reconnectDelay` reenviaria o mesmo token para sempre.
 */
export function tokenRecusado(message: string | null | undefined): boolean {
  return !!message && message.includes("INVALID_TOKEN");
}
