import { API_ENV, INFO_URL } from "@lib/api";
import type { ApiEnv } from "@lib/apiEnv";

// checar-ambiente-da-api (F20, DEC-184, Backend 92661c7): o build de PRODUCAO
// recusa seguir se a API disser que e o staging. Protege do build de producao
// apontando para o banco de teste. Sem faixa visivel (decidido em 03/11): o
// portao de readiness so nao abre.
//
// So recusa com a prova: `env` igual a "staging". Erro de rede, timeout, campo
// ausente (Backend antigo) ou qualquer outro valor deixam seguir — o portao
// de readiness ja cuidou da API fora do ar, e um tropeco aqui nao pode
// trancar a producao inteira.

export type ConferirAmbienteOptions = {
  apiEnv?: ApiEnv;
  url?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

/** true = pode seguir; false = build de producao falando com o staging. */
export async function ambienteDaApiConfere(opts: ConferirAmbienteOptions = {}): Promise<boolean> {
  const apiEnv = opts.apiEnv ?? API_ENV;
  if (apiEnv !== "prod") return true;

  const fetchImpl = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 10_000);
  try {
    const res = await fetchImpl(opts.url ?? INFO_URL, { signal: controller.signal });
    if (!res?.ok) return true;
    const body = await res.json().catch(() => null);
    const env = typeof body?.env === "string" ? body.env.trim().toLowerCase() : "";
    return env !== "staging";
  } catch {
    return true;
  } finally {
    clearTimeout(timer);
  }
}
