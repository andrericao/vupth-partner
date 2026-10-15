// preco-sobre-o-total (DEC-54, Andre 15/10; a mesma conta do PriceSplit do
// Backend, 3e382fa): as taxas incidem sobre o PRECO cobrado. As duas taxas
// moram aqui e so aqui — mudou a do gateway, muda so esta linha.
/** A taxa do gateway (Asaas), em % do preco cobrado. */
export const INTERMEDIARY_PERCENT = 4;
/** A parte do app, em % do preco cobrado. */
export const APP_PERCENT = 2;
const FEE_RATE = (INTERMEDIARY_PERCENT + APP_PERCENT) / 100; // o teto da absorcao, sobre o digitado

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
  /** 4% do valor digitado — a empresa de pagamento. */
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

/** Prova real (DEC-54): depois do gateway e dos 2% do app, sobra ao menos o que o profissional recebe. */
export function passaNaProvaReal(precoCentavos: number, recebeCentavos: number): boolean {
  return (
    precoCentavos -
      porcentoEmCentavos(precoCentavos, INTERMEDIARY_PERCENT) -
      porcentoEmCentavos(precoCentavos, APP_PERCENT) >=
    recebeCentavos
  );
}

/**
 * O preco do cliente (em centavos) para o profissional receber `recebeCentavos`:
 * o X,90 logo acima de recebe / 0,94, subindo R$ 1 ate passar na prova real.
 * Igual ao PriceSplit.clientPriceFor do Backend.
 */
export function precoParaReceber(recebeCentavos: number): number {
  const liquido = 100 - INTERMEDIARY_PERCENT - APP_PERCENT; // 94
  let preco = Math.floor(recebeCentavos / liquido) * 100 + 90;
  if (preco * liquido < recebeCentavos * 100) preco += 100;
  while (!passaNaProvaReal(preco, recebeCentavos)) preco += 100;
  return preco;
}

// Servico legado (sem a divisao gravada): so temos o preco. O maximo que o
// profissional recebe nesse preco e o preco menos as duas taxas — e, com ele a
// 0% de absorcao, a conta devolve o mesmo preco (round-trip da edicao).
export function estimateDesiredFromClient(clientPrice: number): number {
  if (!(clientPrice > 0)) return 0;
  const preco = emCentavos(clientPrice);
  return (
    (preco - porcentoEmCentavos(preco, INTERMEDIARY_PERCENT) - porcentoEmCentavos(preco, APP_PERCENT)) / 100
  );
}

// 🔁 REGRA DO ANDRE (15/10, DEC-54 — substitui a de 16/09, que cobrava os 4%
// sobre o digitado e fazia o app perder a diferenca):
//
//   absorvido     = a parte da taxa que o profissional escolheu pagar (0 a 6% do digitado)
//   recebe        = digitado - absorvido          (o piso: so cai por escolha)
//   cliente       = o menor X,90 que passa na prova real (comeca acima de recebe / 0,94)
//   intermediario = 4% do PRECO
//   app           = cliente - recebe - intermediario   (os 2% + a sobra do X,90)
//   prova real    = cliente - 4% - 2% (do preco) >= recebe
export function calculatePricing(
  desiredPrice: number,
  proAbsorptionPercent: number
): PricingResult {
  const digitado = emCentavos(desiredPrice);
  const absorvido = Math.floor((digitado * FEE_RATE * proAbsorptionPercent) / 100 + 0.5 + 1e-9);
  const recebe = digitado - absorvido;
  const preco = precoParaReceber(recebe);
  const intermediario = porcentoEmCentavos(preco, INTERMEDIARY_PERCENT);

  return {
    clientPrice: preco / 100,
    proReceives: recebe / 100,
    platformFee: (preco - recebe) / 100,
    intermediaryFee: intermediario / 100,
    appFee: (preco - recebe - intermediario) / 100,
  };
}
