import { calculatePricing, estimateDesiredFromClient, getAbsorptionOptions } from "@lib/pricing";

// A divisao do preco que o backend grava no cadastro do servico (contrato no
// ar em PROD desde 18/09; regra do Andre de 16/09). Nomes dos campos conferidos
// no DTO do backend: `pro_receives` e `base_price` em snake_case, ao lado de
// `price`.

/** 422 do backend quando a conta nao fecha — ou o servico e da regra antiga. */
export const ERRO_SPLIT = "SERVICE_PRICE_SPLIT_INVALID";

export function corpoDoSplit(
  digitado: number,
  absorcao: number
): { price: number; pro_receives: number; base_price: number } {
  const p = calculatePricing(digitado, absorcao);
  return { price: p.clientPrice, pro_receives: p.proReceives, base_price: digitado };
}

/**
 * O que a edicao abre. Com a divisao gravada, volta exatamente o digitado e a
 * absorcao (a mais proxima das opcoes). Sem ela (servico legado), estima o
 * digitado pelo preco e marca `legado` — salvar grava a divisao pela 1a vez.
 */
export function precoParaEditar(svc: {
  price: number;
  base_price?: number | null;
  pro_receives?: number | null;
}): { digitado: number; absorcao: number; legado: boolean } {
  const base = svc.base_price;
  const recebe = svc.pro_receives;
  if (base != null && base > 0 && recebe != null) {
    const pct = ((base - recebe) / (base * 0.06)) * 100;
    const opcoes = getAbsorptionOptions(base);
    const absorcao = opcoes.reduce((a, b) => (Math.abs(b - pct) < Math.abs(a - pct) ? b : a), opcoes[0]);
    return { digitado: base, absorcao, legado: false };
  }
  return { digitado: estimateDesiredFromClient(svc.price), absorcao: 0, legado: true };
}

/** Linha do relatorio quando ha atendimento sem divisao (contrato: a tela deve dizer). */
export function avisoSemSplit(semSplit: number | null | undefined): string | null {
  if (!semSplit || semSplit <= 0) return null;
  const n = semSplit === 1 ? "1 atendimento" : `${semSplit} atendimentos`;
  return `${n} de serviço com preço antigo ficou fora do valor líquido. Atualize o preço desses serviços em Meus Serviços.`;
}
