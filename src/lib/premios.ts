import { api } from "@lib/api";
import { formatarReais } from "@lib/dinheiro";

// premio-em-pendentes (Andre, 05/11): cada premio de indicacao ainda nao recebido vira
// uma linha em Seu dia → Pendentes: campanha, valor, estado, primeiro nome do cliente e
// a data do corte. Pago sai de Pendentes. Contrato PROPOSTO pelo Backend (ainda nao no
// ar): GET /referrals/me/credits, do mais novo ao mais antigo. Enquanto nao existir
// (404), a lista vem vazia e nada muda na tela.

export type PremioDeIndicacao = {
  credit_id: string;
  campaign_id?: string | null;
  campaign_name: string;
  amount: number | string;
  share?: "REFERRER" | "OWNER" | "PROFESSIONAL" | string | null;
  /** So o primeiro nome. */
  client_name?: string | null;
  attendance_id?: string | null;
  finished_at?: string | null;
  status: "LOCKED" | "TO_PAY" | "PAID" | string;
  test?: boolean | null;
};

export const CHAVE_PREMIOS = ["premios-de-indicacao"] as const;

/** Os premios prêmio a prêmio. Sem o endpoint (Backend antigo) ou sem resposta: lista vazia. */
export async function meusPremios(): Promise<PremioDeIndicacao[]> {
  try {
    const { data } = await api.get<PremioDeIndicacao[]>("/referrals/me/credits");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Os que ainda nao foram pagos (LOCKED ou TO_PAY). */
export function premiosPendentes(lista: PremioDeIndicacao[]): PremioDeIndicacao[] {
  return lista.filter((p) => p.status !== "PAID");
}

const ESTADO: Record<string, string> = { LOCKED: "a liberar pelo VUPTH", TO_PAY: "a receber" };

function diaDoCorte(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
}

/** A linha: "Teste de Lançamento" · "R$ 5,00" · "a liberar pelo VUPTH" · "Ana · corte em 05/11". */
export function linhaDoPremio(p: PremioDeIndicacao): { titulo: string; valor: string; estado: string; detalhe: string | null } {
  const dia = diaDoCorte(p.finished_at);
  const detalhe = [p.client_name?.trim() || null, dia ? `corte em ${dia}` : null].filter(Boolean).join(" · ");
  return {
    titulo: p.campaign_name,
    valor: formatarReais(Number(p.amount)),
    estado: ESTADO[p.status] ?? "a receber",
    detalhe: detalhe || null,
  };
}
