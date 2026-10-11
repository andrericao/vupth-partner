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
