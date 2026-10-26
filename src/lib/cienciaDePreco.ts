import { api } from "@lib/api";

// ciencia-de-preco (DEC-100, Backend 6784345): politica de precos nova. O
// profissional le o resumo e da a ciencia; passado o prazo sem ela, abrir loja
// e fila ficam bloqueados (409 PRICE_POLICY_ACK_REQUIRED).
export type PoliticaDePreco = {
  version: string | number;
  published_at?: string | null;
  summary?: string | null;
  acknowledged: boolean;
  acknowledged_at?: string | null;
  noticed_at?: string | null;
  deadline_at?: string | null;
  days_left?: number | null;
  blocked?: boolean;
};

export const CHAVE_POLITICA = ["price-policy"] as const;

export async function buscarPolitica(): Promise<PoliticaDePreco | null> {
  try {
    const { data } = await api.get<PoliticaDePreco>("/professional/me/price-policy");
    return data ?? null;
  } catch (e: any) {
    // Sem politica publicada (404) nao e erro para o profissional.
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

export async function darCiencia(version: PoliticaDePreco["version"]): Promise<void> {
  await api.post("/professional/me/price-policy/ack", { version });
}

/** Ha o que ler: foi avisado e ainda nao deu a ciencia. */
export function precisaDeCiencia(p?: PoliticaDePreco | null): boolean {
  return !!p && !p.acknowledged && !!p.noticed_at;
}

/** "Faltam 5 dias", "Falta 1 dia", "Último dia" ou "Prazo encerrado". */
export function prazoDaCiencia(p?: PoliticaDePreco | null): string | null {
  if (!p || p.acknowledged) return null;
  if (p.blocked) return "Prazo encerrado — loja e fila bloqueadas até a ciência";
  const d = p.days_left;
  if (typeof d !== "number") return null;
  if (d <= 0) return "Último dia para dar ciência";
  return d === 1 ? "Falta 1 dia para dar ciência" : `Faltam ${d} dias para dar ciência`;
}
