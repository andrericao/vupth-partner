// preco-sobre-o-total (DEC-54, Andre 15/10; a mesma conta do PriceSplit do
// Backend): as taxas incidem sobre o PRECO cobrado. As taxas moram aqui e so
// aqui.
//
// taxa-fixa-pelo-pior-caso (DEC-91, o app nunca perde; Backend 8cdbeb9): o
// gateway (Asaas) deixa de ser 4% e passa a ser o pior caso exato de cada preco,
// com as taxas cheias, so a vista: o Pix custa um fixo de R$ 1,99 e o credito a
// vista R$ 0,49 + 2,99% do preco. Cobra-se o maior dos dois, centavo para cima
// (a virada e em ~R$ 50,17). Igual ao PriceSplit.intermediaryFor.
/** Pix: taxa fixa do gateway, em centavos. */
export const PIX_FEE_CENTAVOS = 199;
/** Credito a vista: a parte fixa, em centavos. */
export const CARD_FIXED_FEE_CENTAVOS = 49;
/** Credito a vista: 2,99% do preco, em pontos-base de centesimo de % (299 / 10000). */
const CARD_RATE_NUM = 299;
const CARD_RATE_DEN = 10000;
/** A parte do app, em % do preco cobrado. */
export const APP_PERCENT = 2;
/** O teto da absorcao, sobre o digitado: as duas taxas de antes (4% + 2%), como no Backend (FEE_RATE). */
const FEE_RATE = 0.06;

const OPTIONS_BELOW_50 = [0, 50, 100] as const;
const OPTIONS_50_AND_ABOVE = [0, 25, 75, 100] as const;

export function getAbsorptionOptions(desiredPrice: number): readonly number[] {
  return desiredPrice < 50 ? OPTIONS_BELOW_50 : OPTIONS_50_AND_ABOVE;
}

export type PricingResult = {
  clientPrice: number;
  proReceives: number;
  /** Tudo que fica ACIMA do que o pro recebe ("Taxas Vupth" na tela). */
  platformFee: number;
  /** A taxa do gateway no preco do cliente (DEC-91) — a empresa de pagamento. */
  intermediaryFee: number;
  /** O resto do bloco: 2% do digitado + a sobra do arredondamento. */
  appFee: number;
};

/** X,90 mais proximo. */
export function roundTo90(value: number): number {
  return round2(Math.round(value - 0.90) + 0.90);
}

/** Menor X,90 >= value (arredonda pra cima). */
export function ceilTo90(value: number): number {
  // Tira o ruido do float antes do teto: 15 * 1,06 da 15,900000000000002, e
  // sem isto o preco pularia para 16,90.
  const limpo = Math.round(value * 10000) / 10000;
  return round2(Math.ceil(limpo - 0.90) + 0.90);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Centavos de um valor em reais, sem o ruido do float. */
function emCentavos(valor: number): number {
  return Math.round(valor * 100);
}

/** pct% de um valor em centavos, arredondando o meio centavo para cima (HALF_UP do Backend). */
function porcentoEmCentavos(centavos: number, pct: number): number {
  return Math.floor((centavos * pct + 50) / 100);
}

/**
 * A taxa do gateway no preco (DEC-91), em centavos: o maior entre o Pix cheio e
 * o credito a vista cheio, centavo para cima — nunca abaixo da real.
 */
export function taxaDoGatewayEmCentavos(precoCentavos: number): number {
  const cartao =
    CARD_FIXED_FEE_CENTAVOS + Math.floor((precoCentavos * CARD_RATE_NUM + CARD_RATE_DEN - 1) / CARD_RATE_DEN);
  return Math.max(PIX_FEE_CENTAVOS, cartao);
}

/** A mesma taxa, em reais (para quem trabalha com o valor em reais, como o relatorio). */
export function taxaDoGateway(preco: number): number {
  return taxaDoGatewayEmCentavos(emCentavos(preco)) / 100;
}

/** Prova real (DEC-54, DEC-91): depois do gateway e dos 2% do app, sobra ao menos o que o profissional recebe. */
export function passaNaProvaReal(precoCentavos: number, recebeCentavos: number): boolean {
  return (
    precoCentavos - taxaDoGatewayEmCentavos(precoCentavos) - porcentoEmCentavos(precoCentavos, APP_PERCENT) >=
    recebeCentavos
  );
}

/**
 * O preco do cliente (em centavos) para o profissional receber `recebeCentavos`:
 * o X,90 logo acima de recebe, subindo R$ 1 ate passar na prova real. A taxa
 * nao e mais um percentual unico, entao nao ha atalho: comeca em "recebe" e sobe.
 * Igual ao PriceSplit.clientPriceFor do Backend.
 */
export function precoParaReceber(recebeCentavos: number): number {
  let preco = Math.floor(recebeCentavos / 100) * 100 + 90;
  if (preco < recebeCentavos) preco += 100;
  while (!passaNaProvaReal(preco, recebeCentavos)) preco += 100;
  return preco;
}

// Servico legado (sem a divisao gravada): so temos o preco. O maximo que o
// profissional recebe nesse preco e o preco menos as duas taxas — e, com ele a
// 0% de absorcao, a conta devolve o mesmo preco (round-trip da edicao).
export function estimateDesiredFromClient(clientPrice: number): number {
  if (!(clientPrice > 0)) return 0;
  const preco = emCentavos(clientPrice);
  return (preco - taxaDoGatewayEmCentavos(preco) - porcentoEmCentavos(preco, APP_PERCENT)) / 100;
}

// 🔁 REGRA DO ANDRE (15/10, DEC-54 — substitui a de 16/09, que cobrava os 4%
// sobre o digitado e fazia o app perder a diferenca):
//
//   absorvido     = a parte da taxa que o profissional escolheu pagar (0 a 6% do digitado)
//   recebe        = digitado - absorvido          (o piso: so cai por escolha)
//   cliente       = o menor X,90 que passa na prova real (comeca acima de recebe / 0,94)
//   intermediario = max(R$ 1,99; R$ 0,49 + 2,99% do PRECO), centavo para cima (DEC-91)
//   app           = cliente - recebe - intermediario   (os 2% + a sobra do X,90)
//   prova real    = cliente - intermediario - 2% (do preco) >= recebe
export function calculatePricing(
  desiredPrice: number,
  proAbsorptionPercent: number
): PricingResult {
  const digitado = emCentavos(desiredPrice);
  const absorvido = Math.floor((digitado * FEE_RATE * proAbsorptionPercent) / 100 + 0.5 + 1e-9);
  const recebe = digitado - absorvido;
  const preco = precoParaReceber(recebe);
  const intermediario = taxaDoGatewayEmCentavos(preco);

  return {
    clientPrice: preco / 100,
    proReceives: recebe / 100,
    platformFee: (preco - recebe) / 100,
    intermediaryFee: intermediario / 100,
    appFee: (preco - recebe - intermediario) / 100,
  };
}
