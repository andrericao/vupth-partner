import { api, getApiErrorMessage } from "@lib/api";

// cupom-no-app (DEC-61, DEC-63; contrato do Backend 4a94610): o profissional ou
// o dono digita o cupom que o Andre deu e ve o beneficio. Texto curto: campo e
// um botao de uma palavra.

/**
 * O endpoint das campanhas ja esta no ar? Fica `false` ate o push do Backend
 * (branch `campanhas`). Ligado, o item "Promoções" aparece no Perfil e no Menu.
 */
export const CUPOM_NO_AR = false;

export type Campanha = {
  id: string;
  name: string;
  description?: string | null;
  type: "REFERRAL_BONUS" | "FEE_WAIVER" | "DISCOUNT" | string;
  audience?: "CLIENT" | "PROFESSIONAL" | "OWNER" | null;
  value_amount?: number | null;
  value_percent?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  code?: string | null;
  redeemed_at?: string | null;
};

/** Usa o cupom. O Backend nao diferencia maiuscula; mandamos sem espacos. */
export async function usarCupom(codigo: string): Promise<Campanha> {
  const { data } = await api.post<Campanha>("/campaigns/redeem", { code: codigo.trim() });
  return data;
}

/** Os cupons que a pessoa ja usou. */
export async function minhasCampanhas(): Promise<Campanha[]> {
  const { data } = await api.get<Campanha[]>("/campaigns/me");
  return Array.isArray(data) ? data : [];
}

const MENSAGENS: Record<string, string> = {
  CAMPAIGN_NOT_FOUND: "Cupom não encontrado.",
  CAMPAIGN_NOT_AVAILABLE: "Este cupom não está valendo agora.",
  CAMPAIGN_ALREADY_REDEEMED: "Você já usou este cupom.",
  CAMPAIGN_NOT_FOR_YOU: "Este cupom não é para o seu perfil.",
};

/** A recusa do cupom em uma frase curta (DEC-63). */
export function mensagemDoCupom(erro: any): string {
  const codigo = erro?.response?.data?.code;
  if (typeof codigo === "string" && MENSAGENS[codigo]) return MENSAGENS[codigo];
  return getApiErrorMessage(erro, "Não foi possível usar o cupom.");
}

function reais(valor: number): string {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

/** O beneficio em poucas palavras: "R$ 5,00 por cliente", "Sem taxa", "10% de desconto". */
export function beneficioDaCampanha(c: Campanha): string {
  const valor =
    c.value_amount != null && c.value_amount > 0
      ? reais(c.value_amount)
      : c.value_percent != null && c.value_percent > 0
        ? `${c.value_percent}%`
        : null;
  if (c.type === "REFERRAL_BONUS") return valor ? `${valor} por cliente indicado` : "Bônus por indicação";
  if (c.type === "FEE_WAIVER") return "Sem taxa";
  if (c.type === "DISCOUNT") return valor ? `${valor} de desconto` : "Desconto";
  return c.name;
}

/** "até 30/11", quando a campanha tem fim. */
export function validadeDaCampanha(c: Campanha): string | null {
  if (!c.ends_at) return null;
  const d = new Date(c.ends_at);
  if (isNaN(d.getTime())) return null;
  return `até ${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
}
