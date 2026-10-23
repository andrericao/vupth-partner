import { api, getApiErrorMessage, API_ENV } from "@lib/api";
import type { ApiEnv } from "@lib/apiEnv";
import { formatarReais } from "@lib/dinheiro";

// cupom-no-app (DEC-61, DEC-63; contrato do Backend 4a94610): o profissional ou
// o dono digita o cupom que o Andre deu e ve o beneficio. Texto curto: campo e
// um botao de uma palavra.

/**
 * O endpoint das campanhas ja esta no ar? Ligado, o item "Promoções" aparece
 * no Perfil e no Menu. 15/10 23h: o Backend subiu as campanhas (fd2954b
 * ce56d26 b625f19) e o staging responde GET /campaigns/active; a producao
 * (Railway) ainda nao — la fica desligado ate o deploy.
 */
export function cupomNoAr(env: ApiEnv = API_ENV): boolean {
  return env !== "prod";
}
export const CUPOM_NO_AR = cupomNoAr();

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
  status?: "ACTIVE" | "USED" | "EXPIRED" | null;
};

export type CreditoDeCupom = {
  attendance_id: string;
  campaign: string;
  amount: number;
  created_at?: string | null;
  paid_at?: string | null;
};

export type CreditosDeCupom = {
  open_amount: number;
  next_payout?: string | null;
  items: CreditoDeCupom[];
};

/** O desconto que o cliente teve no corte vira credito do profissional, pago no repasse da campanha. */
export async function meusCreditosDeCupom(): Promise<CreditosDeCupom> {
  const { data } = await api.get<CreditosDeCupom>("/professional/me/credits");
  return {
    open_amount: Number(data?.open_amount) || 0,
    next_payout: data?.next_payout ?? null,
    items: Array.isArray(data?.items) ? data.items : [],
  };
}

const ROTULO_DO_ESTADO: Record<string, string> = { USED: "usado", EXPIRED: "vencido" };

/** "usado" ou "vencido"; cupom ativo nao leva rotulo. */
export function estadoDaCampanha(c: Campanha): string | null {
  return (c.status && ROTULO_DO_ESTADO[c.status]) || null;
}

/** As campanhas em andamento para o meu papel (Home). Sem login/campanha: lista vazia. */
export async function campanhasAtivas(): Promise<Campanha[]> {
  const { data } = await api.get<Campanha[]>("/campaigns/active");
  return Array.isArray(data) ? data : [];
}

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
  return formatarReais(valor);
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
