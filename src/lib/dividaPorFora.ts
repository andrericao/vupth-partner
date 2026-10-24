import { api } from "@lib/api";
import { formatarReais } from "@lib/dinheiro";

// divida-por-fora-no-partner (Backend 14eb406, DEC-109/115): cada corte recebido
// por fora do app (cartao, dinheiro, nota) deixa R$ 2,90 de dívida com o app. Com
// a flag do Painel desligada, `open_amount` vem 0 e o valor so e simulado (teste).
export type DividaPorFora = {
  real: boolean;
  open_amount: number;
  simulated_amount: number;
  limit: number;
  over_limit: boolean;
  pix_copy_paste?: string | null;
  holder_name?: string | null;
  items: {
    attendance_id: string;
    amount: number;
    origin?: string | null;
    status?: string | null;
    simulated?: boolean;
    created_at?: string | null;
  }[];
};

export const CHAVE_DIVIDA = ["professional-debt"] as const;

export async function buscarDivida(): Promise<DividaPorFora | null> {
  try {
    const { data } = await api.get<DividaPorFora>("/professional/me/debt");
    if (!data) return null;
    return {
      ...data,
      open_amount: Number(data.open_amount) || 0,
      simulated_amount: Number(data.simulated_amount) || 0,
      limit: Number(data.limit) || 25,
      over_limit: !!data.over_limit,
      items: Array.isArray(data.items) ? data.items : [],
    };
  } catch {
    return null;
  }
}

/** O que a faixa diz: null quando nao ha nada a mostrar. */
export function textoDaDivida(d: DividaPorFora | null | undefined) {
  if (!d) return null;
  if (d.open_amount > 0) {
    return {
      titulo: `Você deve ${formatarReais(d.open_amount)} ao app`,
      detalhe: d.over_limit
        ? `Passou de ${formatarReais(d.limit)}. Pague o Pix para seguir sem aviso.`
        : `Cortes recebidos por fora. Aviso a partir de ${formatarReais(d.limit)}.`,
      teste: false,
      pix: d.over_limit ? (d.pix_copy_paste ?? null) : null,
    };
  }
  if (d.simulated_amount > 0) {
    return {
      titulo: `${formatarReais(d.simulated_amount)} de dívida (teste)`,
      detalhe: "Ainda não vale: só mostra como será.",
      teste: true,
      pix: null,
    };
  }
  return null;
}
