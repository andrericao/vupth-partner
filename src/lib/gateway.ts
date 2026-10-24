import { api } from "@lib/api";

// pagamento-pelo-asaas-no-partner (DEC-119; Backend dea2d00): o Asaas e uma
// conexao que o Painel liga e desliga. GET /payment-gateway -> {connected, mode}
// (mode SANDBOX ou REAL, ausente quando desconectado). Conectado, o webhook
// quita o atendimento sozinho: o profissional nao pede o "Recebi". Desconectado,
// fica o fluxo de sempre. Abaixo de R$ 5,00 o Backend nao cria cobranca.
export type Gateway = { connected: boolean; mode?: "SANDBOX" | "REAL" | null };

export const CHAVE_GATEWAY = ["payment-gateway"] as const;
export const MINIMO_DA_COBRANCA = 5;

/** Sem resposta (ou backend antigo), desconectado: o fluxo de sempre. */
export async function buscarGateway(): Promise<Gateway> {
  try {
    const r = await api.get<Gateway>("/payment-gateway");
    return { connected: r?.data?.connected === true, mode: r?.data?.mode ?? null };
  } catch {
    return { connected: false, mode: null };
  }
}

/** O pagamento deste valor sai pelo Asaas: o profissional nao pede o "Recebi". */
export function pagaPeloApp(gateway: Gateway | null | undefined, valor: number): boolean {
  return gateway?.connected === true && valor >= MINIMO_DA_COBRANCA;
}

/** A faixa "teste": so no sandbox, onde nao ha dinheiro de verdade. */
export function avisoDeTeste(gateway: Gateway | null | undefined): string | null {
  return gateway?.connected === true && gateway.mode === "SANDBOX" ? "Pagamento de teste, sem dinheiro de verdade." : null;
}
