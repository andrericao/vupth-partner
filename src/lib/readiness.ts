import { READINESS_URL } from "@lib/api";

// Portao de readiness / cold start do Render Free (ver CLAUDE.md + PRD_BACKEND
// sec. 18c). O backend hiberna por inatividade; o 1o request depois disso
// acorda a instancia e pode demorar ~50s (boot JVM + migrations). Sem este
// portao, o primeiro cadastro/login dispara antes da hora e falha por timeout.
//
// `waitForBackend` cutuca GET {API}/actuator/health/readiness com retry +
// backoff ate receber 200 {"status":"UP"} (= Postgres respondendo E migrations
// rodadas) ou estourar o teto. A 1a cutucada e o que acorda o Render.

export type WaitForBackendOptions = {
  /** URL do endpoint de readiness (default = READINESS_URL da API). */
  url?: string;
  /** Teto total de espera, em ms (default 90s). */
  ceilingMs?: number;
  /** Timeout por tentativa, em ms (default 60s — a 1a pode segurar ~50s). */
  attemptTimeoutMs?: number;
  /** Backoff inicial entre tentativas, em ms (default 1.5s). */
  initialBackoffMs?: number;
  /** Teto do backoff, em ms (default 8s). */
  maxBackoffMs?: number;
  /** Injetaveis para teste. */
  fetchImpl?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

const DEFAULTS = {
  ceilingMs: 90_000,
  attemptTimeoutMs: 60_000,
  initialBackoffMs: 1_500,
  maxBackoffMs: 8_000,
};

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Uma cutucada: true so com 200 {"status":"UP"}; erro/timeout/!UP => false. */
async function pingReady(
  fetchImpl: typeof fetch,
  url: string,
  timeoutMs: number
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { signal: controller.signal });
    if (!res?.ok) return false;
    const body = await res.json().catch(() => null);
    return body?.status === "UP";
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve true quando o backend responde readiness UP dentro do teto; false se
 * o teto estoura. Nunca rejeita (erros de rede contam como "ainda nao pronto").
 */
export async function waitForBackend(opts: WaitForBackendOptions = {}): Promise<boolean> {
  const url = opts.url ?? READINESS_URL;
  const ceilingMs = opts.ceilingMs ?? DEFAULTS.ceilingMs;
  const attemptTimeoutMs = opts.attemptTimeoutMs ?? DEFAULTS.attemptTimeoutMs;
  const maxBackoffMs = opts.maxBackoffMs ?? DEFAULTS.maxBackoffMs;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const now = opts.now ?? Date.now;
  const sleep = opts.sleep ?? defaultSleep;

  const start = now();
  let backoff = opts.initialBackoffMs ?? DEFAULTS.initialBackoffMs;

  while (now() - start < ceilingMs) {
    if (await pingReady(fetchImpl, url, attemptTimeoutMs)) return true;
    if (now() - start >= ceilingMs) break;
    await sleep(backoff);
    backoff = Math.min(backoff * 2, maxBackoffMs);
  }
  return false;
}
