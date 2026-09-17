const FEE_RATE = 0.06; // 4% intermediador + 2% plataforma
const INTERMEDIARY_RATE = 0.04;

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

// Ao editar um servico ja criado so temos o clientPrice salvo (o preco-base e a
// absorcao nao sao persistidos). Reconstruimos um preco-base que, reprocessado a
// 0% de absorcao, reproduz o mesmo clientPrice — para reexibir o preview na edicao.
// Truncado (nao arredondado): base x 1,06 nunca passa do preco salvo.
export function estimateDesiredFromClient(clientPrice: number): number {
  if (!(clientPrice > 0)) return 0;
  return Math.floor(Math.round((clientPrice / (1 + FEE_RATE)) * 10000) / 100) / 100;
}

// 🔁 REGRA DO ANDRE (16/09): a taxa entra POR CIMA do valor digitado — R$ 10
// + 6% = R$ 10,60 — e o preco SOBE ate o X,90 seguinte: R$ 10,90. A divisao
// nasce aqui e fica gravada; ninguem recalcula 6% sobre os R$ 10,90 depois
// (era esse recalculo que deixava a parte do app negativa na conferencia do
// backend). Antes: `/ 0,94` (6,38%) e X,90 MAIS PROXIMO, que as vezes descia.
//
//   taxa          = 6% do digitado
//   absorvido     = a parte da taxa que o profissional escolheu pagar
//   recebe        = digitado - absorvido          (o piso: so cai por escolha)
//   cliente       = X,90 acima de (digitado + taxa - absorvido)
//   intermediario = 4% do digitado
//   app           = cliente - recebe - intermediario   (2% + arredondamento)
export function calculatePricing(
  desiredPrice: number,
  proAbsorptionPercent: number
): PricingResult {
  const fee = desiredPrice * FEE_RATE;
  const proAbsorbs = fee * (proAbsorptionPercent / 100);

  const proReceives = round2(desiredPrice - proAbsorbs);
  const clientPrice = ceilTo90(desiredPrice + fee - proAbsorbs);
  const platformFee = round2(clientPrice - proReceives);
  const intermediaryFee = round2(desiredPrice * INTERMEDIARY_RATE);
  const appFee = round2(platformFee - intermediaryFee);

  return { clientPrice, proReceives, platformFee, intermediaryFee, appFee };
}
