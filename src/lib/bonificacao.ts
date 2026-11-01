import { api } from "@lib/api";
import { formatarReais } from "@lib/dinheiro";
import { abrirDialogo } from "@store/dialogo.store";

// recebi-mostra-cliente-e-app (DEC-127, Backend 2fed6f5; Andre, 29/10): o desconto de QUALQUER
// promocao (cupom, link, bonificacao, campanha) e pago pelo app. O cliente paga so o corte com
// desconto (mais a multa, que e do app); o profissional recebe o que estipulou e o app repassa a
// diferenca. A conta tem de bater: list_price - discount + penalties = client_pays.
export type Calculo = {
  discounted: boolean;
  list_price?: number | null;
  pro_receives?: number | null;
  discount?: number | null;
  penalties?: number | null;
  client_pays?: number | null;
  /** Some quando e zero. */
  app_pays?: number | null;
  /** O que o profissional recebeu do cliente (padrao: o valor com desconto). */
  received_amount?: number | null;
  /** pro_receives - received_amount: positivo, o app lhe deve ("a receber"); negativo, ele deve ao app ("a pagar"). */
  net_to_professional?: number | null;
};

export const FLAG_COM_DESCONTO = "PAGAMENTO COM DESCONTO";

const num = (v: unknown): number | null => {
  const n = Number(v);
  return v == null || !Number.isFinite(n) ? null : n;
};

export type LinhaDoCalculo = { rotulo: string; valor: string };

/** As linhas do calculo; vazio quando nao ha desconto (o fluxo segue como era). */
export function linhasDoCalculo(b: Calculo | null | undefined): LinhaDoCalculo[] {
  if (!b?.discounted) return [];
  const linhas: LinhaDoCalculo[] = [];
  const corte = num(b.list_price);
  const desconto = num(b.discount);
  const multa = num(b.penalties) ?? 0;
  const cliente = num(b.client_pays);
  const profissional = num(b.pro_receives);
  const app = num(b.app_pays) ?? 0;
  if (corte !== null) linhas.push({ rotulo: "Valor do corte", valor: formatarReais(corte) });
  if (desconto !== null) linhas.push({ rotulo: "Desconto", valor: formatarReais(-Math.abs(desconto)) });
  if (multa > 0) linhas.push({ rotulo: "Multa", valor: formatarReais(multa) });
  if (cliente !== null) {
    linhas.push({ rotulo: multa > 0 ? "Cliente paga (com multa)" : "Cliente paga (sem multa)", valor: formatarReais(cliente) });
  }
  if (profissional !== null) linhas.push({ rotulo: "Você recebe", valor: formatarReais(profissional) });
  if (app > 0) linhas.push({ rotulo: "O app cobre", valor: formatarReais(app) });
  return linhas;
}

/** O texto de uma caixa: a flag e uma linha por item ("Valor do corte: R$ 32,90"). */
export function textoDoCalculo(b: Calculo | null | undefined): string {
  const linhas = linhasDoCalculo(b);
  if (linhas.length === 0) return "";
  return [FLAG_COM_DESCONTO, ...linhas.map((l) => `${l.rotulo}: ${l.valor}`)].join("\n");
}

/** O calculo do pagamento de um atendimento (GET /attendances/{id}/payment); null sem desconto ou se falhar. */
export async function buscarCalculo(attendanceId: string): Promise<Calculo | null> {
  try {
    const { data } = await api.get(`/attendances/${attendanceId}/payment`);
    return data?.breakdown?.discounted ? (data.breakdown as Calculo) : null;
  } catch {
    return null;
  }
}

/**
 * O calculo, mas sem segurar a tela: passou de `prazoMs` (rede lenta, Render frio), segue sem ele.
 * A caixa do card abre na hora; o calculo e um extra, nao um pedagio (CI 29/10: o teste do card
 * esperava a rede e estourava o 1 s do waitFor).
 */
export async function buscarCalculoComPrazo(
  attendanceId: string,
  prazoMs = 2000,
  buscar: typeof buscarCalculo = buscarCalculo
): Promise<Calculo | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), prazoMs);
  });
  try {
    return await Promise.race([buscar(attendanceId), limite]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Depois do "Recebi", so com desconto: quanto o cliente pagou? O padrao (valor com desconto) vai sem
 * `received_amount`; se pagou o cheio ao profissional, informa o cheio (corte + multa) e o saldo muda.
 * `undefined` = padrao (ou sem desconto, ou falha ao ler: o fluxo segue como era).
 */
export async function perguntarValorRecebido(
  attendanceId: string,
  deps: { perguntar?: typeof abrirDialogo; buscar?: typeof buscarCalculo } = {}
): Promise<number | undefined> {
  const calculo = await (deps.buscar ?? buscarCalculo)(attendanceId);
  if (!calculo) return undefined;
  const comDesconto = num(calculo.client_pays) ?? 0;
  const cheio = (num(calculo.list_price) ?? 0) + (num(calculo.penalties) ?? 0);
  if (cheio <= comDesconto) return undefined;
  const escolha = await (deps.perguntar ?? abrirDialogo)({
    titulo: "Quanto o cliente pagou?",
    mensagem: "O app repassa a diferença. Informe o que ele pagou a você.",
    botoes: [
      { texto: `${formatarReais(comDesconto)} (com desconto)` },
      { texto: `${formatarReais(cheio)} (valor cheio)` },
    ],
  });
  return escolha === 1 ? cheio : undefined;
}

export type Saldos = { aReceber: number; aPagar: number; saldo: number };

/** Os saldos compensados do periodo (Relatorio); null quando o backend nao manda ou tudo e zero. */
export function saldosDoRelatorio(
  r: { to_receive_total?: number | null; to_pay_total?: number | null; net_total?: number | null } | null | undefined
): Saldos | null {
  if (!r) return null;
  const aReceber = num(r.to_receive_total);
  const aPagar = num(r.to_pay_total);
  const saldo = num(r.net_total);
  if (aReceber === null && aPagar === null && saldo === null) return null;
  const s = { aReceber: aReceber ?? 0, aPagar: aPagar ?? 0, saldo: saldo ?? (aReceber ?? 0) - (aPagar ?? 0) };
  return s.aReceber === 0 && s.aPagar === 0 && s.saldo === 0 ? null : s;
}
