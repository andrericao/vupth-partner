import { api } from "@lib/api";
import { formatarReais } from "@lib/dinheiro";

// link-de-indicacao (Andre 15/10, DEC-70; contrato do Backend 3fdcec1): o
// profissional ou o dono compartilha o proprio link e ve quantos clientes
// chegaram por ele. O codigo nasce no primeiro pedido e nao muda.
// a-receber-da-indicacao (Backend e5dc2e8, fatia 2): quantos concluiram o
// corte e o valor a receber; Backend antigo nao manda, e a linha some.

export type MeuLink = {
  code: string;
  link: string;
  referred_clients: number;
  credited_clients?: number | null;
  to_receive?: number | string | null;
};

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
