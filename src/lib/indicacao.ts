import { api } from "@lib/api";

// link-de-indicacao (Andre 15/10, DEC-70; contrato do Backend 3fdcec1): o
// profissional ou o dono compartilha o proprio link e ve quantos clientes
// chegaram por ele. O codigo nasce no primeiro pedido e nao muda. O "a
// receber" vem na fatia 2 do Backend.

export type MeuLink = {
  code: string;
  link: string;
  referred_clients: number;
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
