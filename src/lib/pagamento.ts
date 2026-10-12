import { api } from "@lib/api";
import { confirmar } from "@lib/confirmar";

// pagamento-pix (contrato do Backend 2a2b0ec; adendos 1a0616c e 62295f1). O
// pagamento e uma flag do atendimento, aberta na criacao. Antes do Finalizar
// (ou do Iniciar proximo, que finaliza o atual) o app le o pagamento: ja pago,
// segue direto; pendente ou "o cliente diz que pagou", pergunta "O pagamento
// foi efetuado?". Sim -> finish com payment_received: true (fica PAID). Nao ->
// termina e o pagamento segue pendente (Andre, 10/10: e caminho feliz).

type StatusDoPagamento = "PENDING" | "AWAITING_CONFIRMATION" | "PAID";

const reais = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

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
    titulo: "O pagamento foi efetuado?",
    mensagem:
      status === "AWAITING_CONFIRMATION"
        ? `O cliente diz que pagou ${reais(valor)}. Confira no seu banco antes de confirmar.`
        : `Valor do atendimento: ${reais(valor)}. Se ainda não pagou, ele fica pendente e o cliente paga depois.`,
    confirmar: "Sim, recebi",
    cancelar: "Ainda não",
  });
}

/** A mensagem do fim, na tela do profissional (o backend nao manda push a quem tocou). */
export function mensagemDoFim(paymentStatus: string | null | undefined): string | null {
  if (paymentStatus === "PAID") return "Atendimento concluído e pago.";
  if (paymentStatus === "PENDING" || paymentStatus === "AWAITING_CONFIRMATION")
    return "Atendimento concluído, aguardando o pagamento. O cliente pode pagar depois.";
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

/** "Recebi": de PENDING ou AWAITING_CONFIRMATION para PAID (push ao cliente). */
export async function confirmarRecebimento(attendanceId: string): Promise<void> {
  await api.post(`/attendances/${attendanceId}/payment/confirm`);
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
