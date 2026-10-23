import { api } from "@lib/api";
import { confirmar } from "@lib/confirmar";
import { abrirDialogo } from "@store/dialogo.store";
import { formatarReais } from "@lib/dinheiro";

// pagamento-pix (contrato do Backend 2a2b0ec; adendos 1a0616c e 62295f1). O
// pagamento e uma flag do atendimento, aberta na criacao. Antes do Finalizar
// (ou do Iniciar proximo, que finaliza o atual) o app le o pagamento: ja pago,
// segue direto; pendente ou "o cliente diz que pagou", pergunta "Recebeu o
// pagamento?". Recebi -> finish com payment_received: true (fica PAID). Ainda
// nao -> termina e o pagamento segue pendente (Andre, 10/10: e caminho feliz).

type StatusDoPagamento = "PENDING" | "AWAITING_CONFIRMATION" | "PAID";

const reais = formatarReais;

/**
 * undefined = nao perguntar (ja pago, atendimento sem pagamento ou falha ao
 * ler: finaliza como antes). true/false = a resposta do profissional.
 */
export async function perguntarPagamento(
  attendanceId: string,
  deps: { perguntar?: typeof confirmar } = {}
): Promise<boolean | undefined> {
  const perguntar = deps.perguntar ?? confirmar;
  let status: StatusDoPagamento;
  let valor: number;
  try {
    const { data } = await api.get(`/attendances/${attendanceId}/payment`);
    status = data?.status;
    valor = Number(data?.amount ?? 0);
  } catch {
    return undefined;
  }
  if (status !== "PENDING" && status !== "AWAITING_CONFIRMATION") return undefined;

  return perguntar({
    titulo: "Recebeu o pagamento?",
    mensagem:
      status === "AWAITING_CONFIRMATION"
        ? `O cliente diz que pagou ${reais(valor)}. Confira no seu banco antes de confirmar.`
        : `${reais(valor)}. Se ainda não, fica pendente.`,
    confirmar: "Recebi",
    cancelar: "Ainda não",
  });
}

/** A mensagem do fim, na tela do profissional (o backend nao manda push a quem tocou). */
export function mensagemDoFim(paymentStatus: string | null | undefined): string | null {
  if (paymentStatus === "PAID") return "Atendimento concluído e pago.";
  if (paymentStatus === "PENDING" || paymentStatus === "AWAITING_CONFIRMATION")
    return "Concluído. Pagamento pendente.";
  return null;
}

// ── Pendentes do profissional (adendo 1a0616c): os finalizados com PENDING e
// os que o cliente diz que pagou (AWAITING_CONFIRMATION, em qualquer status).
// awaiting_count e o numero do dot.
export type PagamentoPendente = {
  attendance_id: string;
  status: "PENDING" | "AWAITING_CONFIRMATION";
  amount: number;
  client_name: string;
  finished_at: string | null;
  claimed_at: string | null;
};

export async function obterPagamentosPendentes(): Promise<{ awaiting_count: number; items: PagamentoPendente[] }> {
  const { data } = await api.get("/professional/me/pending-payments");
  return { awaiting_count: data?.awaiting_count ?? 0, items: data?.items ?? [] };
}

/**
 * forma-de-recebimento (Andre, fase de testes sem gateway; Backend 8b158e3): como
 * o profissional recebeu. So registro — nao aparece para o cliente nem nos
 * relatorios, e e opcional.
 */
export type FormaDeRecebimento = "PIX" | "CARTAO" | "DINHEIRO" | "NOTA";

export const FORMAS_DE_RECEBIMENTO: { valor: FormaDeRecebimento; rotulo: string }[] = [
  { valor: "PIX", rotulo: "Pix" },
  { valor: "CARTAO", rotulo: "Cartão" },
  { valor: "DINHEIRO", rotulo: "Dinheiro" },
  { valor: "NOTA", rotulo: "Nota" },
];

/** Depois do "Recebi": como? `undefined` = pulou (o fluxo segue igual). */
export async function perguntarForma(
  deps: { perguntar?: typeof abrirDialogo } = {}
): Promise<FormaDeRecebimento | undefined> {
  const perguntar = deps.perguntar ?? abrirDialogo;
  const escolha = await perguntar({
    titulo: "Como recebeu?",
    mensagem: "Só para o seu registro. Pode pular.",
    botoes: [
      ...FORMAS_DE_RECEBIMENTO.map((f) => ({ texto: f.rotulo })),
      { texto: "Pular", estilo: "cancel" as const },
    ],
  });
  return FORMAS_DE_RECEBIMENTO[escolha]?.valor;
}

/** "Recebi": de PENDING ou AWAITING_CONFIRMATION para PAID (push ao cliente). */
export async function confirmarRecebimento(
  attendanceId: string,
  forma?: FormaDeRecebimento
): Promise<void> {
  await api.post(
    `/attendances/${attendanceId}/payment/confirm`,
    forma ? { method: forma } : undefined
  );
}

/** PAYMENT_CLAIMED / PAYMENT_CONFIRMED no WS pessoal: re-busca os pendentes. */
export function isPaymentEvent(type: string | null | undefined): boolean {
  return !!type && type.startsWith("PAYMENT_");
}

/** A observacao embaixo do card (Andre, 10/10). */
export function observacaoDoPagamento(status: PagamentoPendente["status"]): string {
  return status === "AWAITING_CONFIRMATION"
    ? "Confirme se o pagamento foi efetuado"
    : "Aguardando o cliente efetuar o pagamento";
}

export { reais as formatarReais };

/** O pagamento ao lado do status, no historico ("Concluido · aguardando pagamento"). */
export function rotuloDoPagamento(status: string | null | undefined): string | null {
  if (status === "PAID") return "pago";
  if (status === "PENDING") return "aguardando pagamento";
  if (status === "AWAITING_CONFIRMATION") return "pagamento a confirmar";
  return null;
}
