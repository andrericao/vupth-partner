import {
  calculatePricing,
  roundTo90,
  getAbsorptionOptions,
} from "../pricing";

describe("roundTo90", () => {
  it("rounds 31.91 to 31.90", () => {
    expect(roundTo90(31.91)).toBe(31.90);
  });

  it("rounds 30.00 to 29.90", () => {
    expect(roundTo90(30.0)).toBe(29.90);
  });

  it("rounds 30.50 to 30.90", () => {
    expect(roundTo90(30.5)).toBe(30.90);
  });

  it("rounds 32.40 to 32.90", () => {
    expect(roundTo90(32.4)).toBe(32.90);
  });

  it("rounds 29.90 to 29.90 (already .90)", () => {
    expect(roundTo90(29.9)).toBe(29.90);
  });

  it("rounds 100.00 to 99.90", () => {
    expect(roundTo90(100.0)).toBe(99.90);
  });
});

describe("getAbsorptionOptions", () => {
  it("returns [0, 50, 100] for prices below R$50", () => {
    expect(getAbsorptionOptions(30)).toEqual([0, 50, 100]);
    expect(getAbsorptionOptions(49.99)).toEqual([0, 50, 100]);
    expect(getAbsorptionOptions(5)).toEqual([0, 50, 100]);
  });

  it("returns [0, 25, 75, 100] for prices >= R$50", () => {
    expect(getAbsorptionOptions(50)).toEqual([0, 25, 75, 100]);
    expect(getAbsorptionOptions(100)).toEqual([0, 25, 75, 100]);
    expect(getAbsorptionOptions(500)).toEqual([0, 25, 75, 100]);
  });

  it("always includes 0 and 100", () => {
    [10, 30, 49, 50, 100, 200].forEach((price) => {
      const opts = getAbsorptionOptions(price);
      expect(opts[0]).toBe(0);
      expect(opts[opts.length - 1]).toBe(100);
    });
  });
});

describe("calculatePricing", () => {
  it("returns clientPrice always ending in .90", () => {
    [0, 25, 50, 75, 100].forEach((pct) => {
      const result = calculatePricing(30, pct);
      const decimals = result.clientPrice.toFixed(2).split(".")[1];
      expect(decimals).toBe("90");
    });
  });

  it("proReceives + platformFee = clientPrice", () => {
    [0, 25, 50, 75, 100].forEach((pct) => {
      const { clientPrice, proReceives, platformFee } = calculatePricing(50, pct);
      expect(proReceives + platformFee).toBeCloseTo(clientPrice, 2);
    });
  });

  it("higher absorption = lower or equal clientPrice", () => {
    const options = [0, 25, 50, 75, 100];
    const prices = options.map((pct) => calculatePricing(80, pct).clientPrice);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });

  it("higher absorption = lower or equal proReceives", () => {
    const options = [0, 25, 50, 75, 100];
    const receives = options.map((pct) => calculatePricing(80, pct).proReceives);
    for (let i = 1; i < receives.length; i++) {
      expect(receives[i]).toBeLessThanOrEqual(receives[i - 1]);
    }
  });

  it("platformFee is always 6% of clientPrice", () => {
    [0, 50, 100].forEach((pct) => {
      const { clientPrice, platformFee } = calculatePricing(40, pct);
      const expected = Math.round(clientPrice * 0.06 * 100) / 100;
      expect(platformFee).toBeCloseTo(expected, 2);
    });
  });

  describe("R$30 — opção B (< R$50: 0%, 50%, 100%)", () => {
    it("0% absorption (client pays all)", () => {
      const r = calculatePricing(30, 0);
      expect(r.clientPrice).toBe(31.90);
      expect(r.platformFee).toBe(1.91);
      expect(r.proReceives).toBe(29.99);
    });

    it("50% absorption", () => {
      const r = calculatePricing(30, 50);
      expect(r.clientPrice).toBe(30.90);
      expect(r.platformFee).toBe(1.85);
      expect(r.proReceives).toBe(29.05);
    });

    it("100% absorption (pro pays all)", () => {
      const r = calculatePricing(30, 100);
      expect(r.clientPrice).toBe(29.90);
      expect(r.platformFee).toBe(1.79);
      expect(r.proReceives).toBe(28.11);
    });
  });

  describe("R$50 — opção A (>= R$50: 0%, 25%, 75%, 100%)", () => {
    it("0% absorption", () => {
      const r = calculatePricing(50, 0);
      expect(r.clientPrice).toBe(52.90);
      expect(r.platformFee).toBe(3.17);
      expect(r.proReceives).toBe(49.73);
    });

    it("25% absorption", () => {
      const r = calculatePricing(50, 25);
      expect(r.clientPrice).toBe(51.90);
      expect(r.platformFee).toBe(3.11);
      expect(r.proReceives).toBe(48.79);
    });

    it("75% absorption", () => {
      const r = calculatePricing(50, 75);
      expect(r.clientPrice).toBe(50.90);
      expect(r.platformFee).toBe(3.05);
      expect(r.proReceives).toBe(47.85);
    });

    it("100% absorption", () => {
      const r = calculatePricing(50, 100);
      expect(r.clientPrice).toBe(49.90);
      expect(r.platformFee).toBe(2.99);
      expect(r.proReceives).toBe(46.91);
    });
  });

  describe("R$100 — opção A", () => {
    it("0% absorption", () => {
      const r = calculatePricing(100, 0);
      expect(r.clientPrice).toBe(105.90);
      expect(r.platformFee).toBe(6.35);
      expect(r.proReceives).toBe(99.55);
    });

    it("25% absorption", () => {
      const r = calculatePricing(100, 25);
      expect(r.clientPrice).toBe(104.90);
      expect(r.platformFee).toBe(6.29);
      expect(r.proReceives).toBe(98.61);
    });

    it("75% absorption", () => {
      const r = calculatePricing(100, 75);
      expect(r.clientPrice).toBe(101.90);
      expect(r.platformFee).toBe(6.11);
      expect(r.proReceives).toBe(95.79);
    });

    it("100% absorption", () => {
      const r = calculatePricing(100, 100);
      expect(r.clientPrice).toBe(99.90);
      expect(r.platformFee).toBe(5.99);
      expect(r.proReceives).toBe(93.91);
    });
  });

  it("works with small price R$5", () => {
    const r = calculatePricing(5, 50);
    const decimals = r.clientPrice.toFixed(2).split(".")[1];
    expect(decimals).toBe("90");
    expect(r.proReceives).toBeGreaterThan(0);
  });

  it("works with high prices R$500", () => {
    const r = calculatePricing(500, 25);
    const decimals = r.clientPrice.toFixed(2).split(".")[1];
    expect(decimals).toBe("90");
    expect(r.proReceives).toBeGreaterThan(0);
  });
});
