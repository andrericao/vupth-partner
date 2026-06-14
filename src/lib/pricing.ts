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

export function roundTo90(value: number): number {
  return Math.round(value - 0.90) + 0.90;
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
  const rawClientPrice = fullMarkupPrice - proAbsorbs;

  const clientPrice = roundTo90(rawClientPrice);
  const platformFee = round2(clientPrice * FEE_RATE);
  const proReceives = round2(clientPrice - platformFee);

  return { clientPrice, proReceives, platformFee };
}
