import { api } from "@lib/api";
import { confirmar } from "@lib/confirmar";
import { formatarReais } from "@lib/dinheiro";
import { textoDoCalculo, type Calculo } from "@lib/bonificacao";
import type { LinhaDoDialogo } from "@store/dialogo.store";

// pagamento-pix (contrato do Backend 2a2b0ec; adendos 1a0616c e 62295f1). O
// pagamento e uma flag do atendimento, aberta na criacao. Antes do Finalizar
// (ou do Iniciar proximo, que finaliza o atual) o app le o pagamento: ja pago,
// segue direto; pendente ou "o cliente diz que pagou", pergunta "Recebeu o
// pagamento?". Recebi -> finish com payment_received: true (fica PAID). Ainda
// nao -> termina e o pagamento segue pendente (Andre, 10/10: e caminho feliz).

type StatusDoPagamento = "PENDING" | "AWAITING_CONFIRMATION" | "PAID";

const reais = formatarReais;

type TaxasDoPagamento = {
  app_percent_fee?: number | null;
  rounding_fee?: number | null;
  gateway_fee_simulated?: number | null;
  fees_active?: boolean | null;
};

/** PAR-6 (BAK 4b1fb2c): as taxas do corte; riscadas com fees_active falso. Servico legado nao traz. */
export function linhasDasTaxas(p: TaxasDoPagamento | null | undefined): LinhaDoDialogo[] {
  if (typeof p?.fees_active !== "boolean") return [];
  const riscada = !p.fees_active;
  const linhas: LinhaDoDialogo[] = [];
  const taxa = (rotulo: string, v: number | null | undefined) => {
    if (typeof v === "number" && Number.isFinite(v)) linhas.push({ rotulo, valor: reais(v), riscada });
  };
  taxa("Taxa do app (2%)", p.app_percent_fee);
  taxa("Arredondamento", p.rounding_fee);
  taxa("Taxa da empresa de pagamento", p.gateway_fee_simulated);
  return linhas;
}

/** As linhas das taxas de um atendimento; sem resposta em `prazoMs`, abre a caixa sem elas. */
export async function buscarTaxas(attendanceId: string, prazoMs = 2000): Promise<LinhaDoDialogo[]> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<LinhaDoDialogo[]>((resolve) => {
    timer = setTimeout(() => resolve([]), prazoMs);
  });
  const leitura = api
    .get(`/attendances/${attendanceId}/payment`)
    .then(({ data }) => linhasDasTaxas(data))
    .catch(() => []);
  try {
    return await Promise.race([leitura, limite]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * undefined = nao perguntar (ja pago, atendimento sem pagamento ou falha ao
 * ler: finaliza como antes). true/false = a resposta do profissional.
 */
export async function perguntarPagamento(
  attendanceId: string,
  deps: { perguntar?: typeof confirmar; cliente?: string | null } = {}
): Promise<boolean | undefined> {
  const perguntar = deps.perguntar ?? confirmar;
  let status: StatusDoPagamento;
  let valor: number;
  let calculo: Calculo | null = null;
  let taxas: LinhaDoDialogo[] = [];
  try {
    const { data } = await api.get(`/attendances/${attendanceId}/payment`);
    status = data?.status;
    valor = Number(data?.amount ?? 0);
    calculo = data?.breakdown ?? null;
    taxas = linhasDasTaxas(data);
  } catch {
    return undefined;
  }
  if (status !== "PENDING" && status !== "AWAITING_CONFIRMATION") return undefined;
  // recebi-ao-finalizar-corte (Andre, 25/10): logo apos o Finalizar, com o pagamento ainda
  // pendente, o profissional sempre ve "Recebeu o pagamento?" — com ou sem Asaas conectado
  // (o Asaas e o "Recebi" quitam o mesmo atendimento; quem chega primeiro vence).
  const quem = deps.cliente ? `${deps.cliente} · ` : "";
  const recebeu = await perguntar({
    titulo: "Recebeu o pagamento?",
    mensagem:
      (status === "AWAITING_CONFIRMATION"
        ? `${deps.cliente ?? "O cliente"} diz que pagou ${reais(valor)}. Confira no seu banco.`
        : `${quem}${reais(valor)}. Se ainda não, fica pendente.`) +
      // recebi-mostra-cliente-e-app (DEC-127): com desconto, a flag e o calculo que bate.
      (textoDoCalculo(calculo) ? `\n\n${textoDoCalculo(calculo)}` : ""),
    ...(taxas.length > 0 ? { linhas: taxas } : {}),
    confirmar: "Recebi",
    cancelar: "Não recebi",
  });
  // "Não recebi" diante de um "já paguei" do cliente = Recusar (volta a pendente e o cliente e avisado).
  if (!recebeu && status === "AWAITING_CONFIRMATION") {
    await recusarRecebimento(attendanceId).catch(() => {});
  }
  return recebeu;
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
export async function confirmarRecebimento(
  attendanceId: string,
  valorRecebido?: number
): Promise<void> {
  // tirar-forma-de-pagamento (Andre, 06/11): so o "Recebi", sem method.
  // received_amount (DEC-127): so quando o cliente pagou diferente do valor com desconto.
  await api.post(
    `/attendances/${attendanceId}/payment/confirm`,
    valorRecebido !== undefined ? { received_amount: valorRecebido } : undefined
  );
}

/**
 * "Recusar" (Backend 9f2f6fb): o profissional nao recebeu o que o cliente disse que pagou.
 * So vale de AWAITING_CONFIRMATION (senao 409 PAYMENT_INVALID_STATUS); volta a PENDING.
 */
export async function recusarRecebimento(attendanceId: string): Promise<void> {
  await api.post(`/attendances/${attendanceId}/payment/refuse`);
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
