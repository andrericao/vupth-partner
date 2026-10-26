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
  weekdays?: string | null;
  max_redemptions?: number | null;
  remaining_slots?: number | null;
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

// DEC-122: quem emite, compartilha e usa vem da configuracao da campanha, nao do
// codigo. O Backend so lista o que o papel de quem chama pode ver; o app nao
// poe regra de papel fixa por cima (travado em campanhas.test.ts).
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
  CAMPAIGN_ALREADY_REDEEMED: "Este cupom já está ativado.",
  CAMPAIGN_NOT_FOR_YOU: "Este cupom não é para o seu perfil.",
};

/** promocoes-ativar-e-codigo (Andre, 24/10): o cupom e ATIVADO (nao "usado"); "usado" e so o cupom aplicado em corte. */
export const CUPOM_ATIVADO = "Cupom ativado";

/** A recusa do cupom em uma frase curta (DEC-63). */
export function mensagemDoCupom(erro: any): string {
  const codigo = erro?.response?.data?.code;
  if (typeof codigo === "string" && MENSAGENS[codigo]) return MENSAGENS[codigo];
  return getApiErrorMessage(erro, "Não foi possível ativar o cupom.");
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

const DIAS: Record<string, string> = {
  MONDAY: "segundas",
  TUESDAY: "terças",
  WEDNESDAY: "quartas",
  THURSDAY: "quintas",
  FRIDAY: "sextas",
  SATURDAY: "sábados",
  SUNDAY: "domingos",
};

/** "terças, quartas e quintas"; sem o campo, "todos os dias". */
export function diasDaCampanha(c: Pick<Campanha, "weekdays">): string {
  const dias = (c.weekdays ?? "")
    .split(",")
    .map((d) => DIAS[d.trim().toUpperCase()])
    .filter(Boolean);
  if (dias.length === 0 || dias.length === 7) return "todos os dias";
  if (dias.length === 1) return dias[0];
  return `${dias.slice(0, -1).join(", ")} e ${dias[dias.length - 1]}`;
}

/** DEC-124: "Válido até 17/11 às 00:00" (hora do Painel, Brasília); sem fim, null. */
export function validadeAoAtivar(c: Pick<Campanha, "ends_at">): string | null {
  if (!c.ends_at) return null;
  const d = new Date(c.ends_at);
  if (isNaN(d.getTime())) return null;
  const fuso = "America/Sao_Paulo";
  const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: fuso });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: fuso });
  return `Válido até ${dia} às ${hora}`;
}

/**
 * DEC-124 (Backend campanha-vaga-e-prazo): 409 CAMPAIGN_ENDED = passou do prazo;
 * 409 CAMPAIGN_SOLD_OUT = no prazo e sem vaga. Sai de join, redeem e claim.
 */
export function motivoDoErro(erro: any): "ENCERRADA" | "ESGOTADA" | null {
  const codigo = erro?.response?.data?.code;
  if (codigo === "CAMPAIGN_ENDED") return "ENCERRADA";
  if (codigo === "CAMPAIGN_SOLD_OUT") return "ESGOTADA";
  return null;
}

/**
 * DEC-124: primeiro o prazo, depois a vaga. Passou do ends_at = ENCERRADA (para
 * todos, inclusive quem ativou e nao usou); no prazo e sem vaga = ESGOTADA.
 */
export function estadoDoPrazo(
  c: Pick<Campanha, "ends_at" | "remaining_slots">,
  agora: Date = new Date()
): "ENCERRADA" | "ESGOTADA" | null {
  if (c.ends_at) {
    const fim = new Date(c.ends_at).getTime();
    if (!isNaN(fim) && fim < agora.getTime()) return "ENCERRADA";
  }
  if (c.remaining_slots === 0) return "ESGOTADA";
  return null;
}

/** O destaque do card ticket: "R$ 5,00", "10%" ou "Sem taxa"; tipo sem valor, o nome. */
export function valorDoCard(c: Pick<Campanha, "type" | "value_amount" | "value_percent" | "name">): string {
  if (c.type === "FEE_WAIVER") return "Sem taxa";
  if (c.value_amount != null && c.value_amount > 0) return formatarReais(c.value_amount);
  if (c.value_percent != null && c.value_percent > 0) return `${c.value_percent}%`;
  return c.type === "REFERRAL_BONUS" ? "Bônus" : c.name;
}
