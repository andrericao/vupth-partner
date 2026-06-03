const PAYMENT_FEE_RATE = 0.04;
const PLATFORM_FEE_RATE = 0.02;

export type PriceBreakdown = {
  professionalPrice: number;
  paymentFee: number;
  platformFee: number;
  subtotal: number;
  roundingBonus: number;
  clientPrice: number;
  totalPlatformRevenue: number;
};

function roundToNinety(value: number): number {
  const intPart = Math.floor(value);
  if (value <= intPart + 0.9) {
    return intPart + 0.9;
  }
  return intPart + 1.9;
}

export function calculateClientPrice(professionalPrice: number): PriceBreakdown {
  const paymentFee = professionalPrice * PAYMENT_FEE_RATE;
  const platformFee = professionalPrice * PLATFORM_FEE_RATE;
  const subtotal = professionalPrice + paymentFee + platformFee;
  const clientPrice = roundToNinety(subtotal);
  const roundingBonus = clientPrice - subtotal;
  const totalPlatformRevenue = platformFee + roundingBonus;

  return {
    professionalPrice: round2(professionalPrice),
    paymentFee: round2(paymentFee),
    platformFee: round2(platformFee),
    subtotal: round2(subtotal),
    roundingBonus: round2(roundingBonus),
    clientPrice: round2(clientPrice),
    totalPlatformRevenue: round2(totalPlatformRevenue),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}
