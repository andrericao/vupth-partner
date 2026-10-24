import { api } from "@lib/api";
import { formatarReais } from "@lib/dinheiro";

// link-de-indicacao (Andre 15/10, DEC-70; contrato do Backend 3fdcec1): o
// profissional ou o dono compartilha o proprio link e ve quantos clientes
// chegaram por ele. O codigo nasce no primeiro pedido e nao muda.
// a-receber-da-indicacao (Backend e5dc2e8, fatia 2): quantos concluiram o
// corte e o valor a receber; Backend antigo nao manda, e a linha some.

// compartilhe-e-ganhe-no-partner (Backend fcd4fd3, DEC-113): o profissional ou o
// dono entra na campanha de link por adesao (POST /campaigns/{id}/join); cada
// campanha tem o link dele (?c=) e o ganho nasce travado ate o Andre liberar.
export type LinkDaCampanha = {
  campaign_id: string;
  name: string;
  link: string;
  ends_at?: string | null;
  referred?: number | null;
  credited?: number | null;
};

export type MeuLink = {
  code: string;
  link: string;
  referred_clients: number;
  credited_clients?: number | null;
  to_receive?: number | string | null;
  campaigns?: LinkDaCampanha[] | null;
  pending_release?: number | string | null;
};

/** Entra na campanha de link (POST /campaigns/{id}/join). */
export async function participarDaCampanha(id: string): Promise<void> {
  await api.post(`/campaigns/${id}/join`);
}

const RECUSA_DA_ADESAO: Record<string, string> = {
  CAMPAIGN_NOT_FOUND: "Campanha não encontrada.",
  CAMPAIGN_NOT_AVAILABLE: "Esta campanha não está valendo agora.",
  CAMPAIGN_ALREADY_REDEEMED: "Você já participa desta campanha.",
  CAMPAIGN_NOT_FOR_YOU: "Esta campanha não é para o seu perfil.",
};

/** A recusa da adesao em uma frase curta. */
export function mensagemDaAdesao(erro: any): string {
  const codigo = erro?.response?.data?.code;
  if (typeof codigo === "string" && RECUSA_DA_ADESAO[codigo]) return RECUSA_DA_ADESAO[codigo];
  return "Não foi possível participar agora.";
}

/** "R$ 5,00 a liberar"; sem ganho travado (ou campo ausente), null. */
export function aLiberar(meu: Pick<MeuLink, "pending_release">): string | null {
  const v = Number(meu.pending_release);
  if (!Number.isFinite(v) || v <= 0) return null;
  return `${formatarReais(v)} a liberar pelo VUPTH`;
}

/** "2 chegaram · 1 concluiu o corte". */
export function andamentoDaCampanha(c: Pick<LinkDaCampanha, "referred" | "credited">): string {
  const chegaram = c.referred ?? 0;
  const concluiram = c.credited ?? 0;
  const a = chegaram === 1 ? "1 chegou" : `${chegaram} chegaram`;
  const b = concluiram === 1 ? "1 concluiu o corte" : `${concluiram} concluíram o corte`;
  return `${a} · ${b}`;
}

/** O link de quem indica (GET /referrals/me). */
export async function meuLinkDeIndicacao(): Promise<MeuLink> {
  const { data } = await api.get<MeuLink>("/referrals/me");
  return data;
}

/** "Nenhum cliente ainda", "1 cliente chegou", "3 clientes chegaram". */
export function clientesQueChegaram(n: number): string {
  if (!n || n < 1) return "Nenhum cliente chegou pelo seu link ainda.";
  if (n === 1) return "1 cliente chegou pelo seu link.";
  return `${n} clientes chegaram pelo seu link.`;
}

/** "2 concluíram o corte · R$ 10,00 a receber"; sem os campos, null. */
export function aReceber(meu: Pick<MeuLink, "credited_clients" | "to_receive">): string | null {
  const n = meu.credited_clients;
  if (n === undefined || n === null) return null;
  const valor = Number(meu.to_receive ?? 0);
  const reais = formatarReais(Number.isFinite(valor) ? valor : 0);
  const quem = n === 1 ? "1 concluiu o corte" : `${n} concluíram o corte`;
  return `${quem} · ${reais} a receber`;
}
