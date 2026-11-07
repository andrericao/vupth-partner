import { api } from "@lib/api";
import { formatarReais } from "@lib/dinheiro";

// pago-no-relatorio (Andre, 06/11; Backend BAK-10): o que o VUPTH ja pagou ao profissional.
// GET /referrals/me/payments devolve so os dele. O estorno e outra linha (REVERSAL) e marca
// o pagamento original com reversed. Sem o endpoint ou sem resposta: lista vazia.

export type PagamentoRecebido = {
  id: string;
  campaign_name?: string | null;
  type: "PAYMENT" | "REVERSAL" | string;
  amount: number | string;
  paid_at?: string | null;
  note?: string | null;
  reversed?: boolean | null;
};

export const CHAVE_PAGAMENTOS_RECEBIDOS = ["pagamentos-recebidos"] as const;

export async function meusPagamentos(): Promise<PagamentoRecebido[]> {
  try {
    const { data } = await api.get<PagamentoRecebido[]>("/referrals/me/payments");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** So os pagamentos: o estorno aparece na linha do pagamento que ele desfez. */
export function pagamentosParaMostrar(lista: PagamentoRecebido[]): PagamentoRecebido[] {
  return lista.filter((p) => p.type === "PAYMENT");
}

function diaDoPagamento(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
}

/** A linha: "Teste de Lançamento" · "R$ 5,00" · "pago em 06/11" · a nota. */
export function linhaDoPagamento(p: PagamentoRecebido): {
  titulo: string;
  valor: string;
  estado: string;
  nota: string | null;
} {
  const dia = diaDoPagamento(p.paid_at);
  const pago = dia ? `pago em ${dia}` : "pago";
  return {
    titulo: p.campaign_name?.trim() || "Prêmios de indicação",
    valor: formatarReais(Number(p.amount)),
    estado: p.reversed ? `${pago} · estornado` : pago,
    nota: p.note?.trim() || null,
  };
}
