const FEE_RATE = 0.06; // 4% intermediador + 2% plataforma

const OPTIONS_BELOW_50 = [0, 50, 100] as const;
const OPTIONS_50_AND_ABOVE = [0, 25, 75, 100] as const;

export function getAbsorptionOptions(desiredPrice: number): readonly number[] {
  return desiredPrice < 50 ? OPTIONS_BELOW_50 : OPTIONS_50_AND_ABOVE;
}

export type PricingResult = {
  clientPrice: number;
  proReceives: number;
  platformFee: number;
};

/** X,90 mais proximo. */
export function roundTo90(value: number): number {
  return round2(Math.round(value - 0.90) + 0.90);
}

/** Menor X,90 >= value (arredonda pra cima). */
export function ceilTo90(value: number): number {
  return round2(Math.ceil(value - 0.90) + 0.90);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculatePricing(
  desiredPrice: number,
  proAbsorptionPercent: number
): PricingResult {
  const fullMarkupPrice = desiredPrice / (1 - FEE_RATE);
  const totalFee = fullMarkupPrice - desiredPrice;
  const proAbsorbs = totalFee * (proAbsorptionPercent / 100);

  // "Voce recebe" = piso. O profissional recebe EXATAMENTE o que digitou menos
  // o que ELE optou por absorver (0% = cliente paga tudo = recebe o digitado,
  // sem perder centavos pro arredondamento). A absorcao segue reduzindo o que
  // ele recebe, mas so por escolha dele.
  const proReceives = round2(desiredPrice - proAbsorbs);

  // Preco do cliente em X,90; a taxa e tudo que fica ACIMA do que o pro recebe.
  // Garante cobrir o piso do profissional (fee >= 0), inclusive em precos baixos.
  let clientPrice = roundTo90(fullMarkupPrice - proAbsorbs);
  if (clientPrice < proReceives) clientPrice = ceilTo90(proReceives);
  const platformFee = round2(clientPrice - proReceives);

  return { clientPrice, proReceives, platformFee };
}
