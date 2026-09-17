import {
  calculatePricing,
  roundTo90,
  ceilTo90,
  getAbsorptionOptions,
  estimateDesiredFromClient,
} from "../pricing";

describe("estimateDesiredFromClient", () => {
  // Usado ao EDITAR um servico ja criado: so guardamos o clientPrice; a partir
  // dele reconstruimos o preco-base para reexibir o preview (a 0% de absorcao).
  it("reproduz o clientPrice salvo quando reprocessado a 0% (round-trip)", () => {
    for (const client of [9.9, 29.9, 36.9, 50.9, 100.9]) {
      const base = estimateDesiredFromClient(client);
      expect(calculatePricing(base, 0).clientPrice).toBe(client);
    }
  });
  it("retorna 0 para entradas não positivas", () => {
    expect(estimateDesiredFromClient(0)).toBe(0);
    expect(estimateDesiredFromClient(-5)).toBe(0);
  });
});

describe("roundTo90", () => {
  it("rounds 31.91 to 31.90", () => {
    expect(roundTo90(31.91)).toBe(31.9);
  });
  it("rounds 30.00 to 29.90", () => {
    expect(roundTo90(30.0)).toBe(29.9);
  });
  it("rounds 30.50 to 30.90", () => {
    expect(roundTo90(30.5)).toBe(30.9);
  });
  it("rounds 29.90 to 29.90 (already .90)", () => {
    expect(roundTo90(29.9)).toBe(29.9);
  });
});

describe("ceilTo90", () => {
  it("rounds up to the next X,90", () => {
    expect(ceilTo90(31.915)).toBe(32.9); // 31.90 < 31.915 -> sobe pra 32.90
    expect(ceilTo90(5)).toBe(5.9);
    expect(ceilTo90(30)).toBe(30.9);
  });
  it("keeps a value already ending in ,90", () => {
    expect(ceilTo90(31.9)).toBe(31.9);
    expect(ceilTo90(29.9)).toBe(29.9);
  });
});

describe("getAbsorptionOptions", () => {
  it("returns [0, 50, 100] for prices below R$50", () => {
    expect(getAbsorptionOptions(30)).toEqual([0, 50, 100]);
    expect(getAbsorptionOptions(49.99)).toEqual([0, 50, 100]);
  });
  it("returns [0, 25, 75, 100] for prices >= R$50", () => {
    expect(getAbsorptionOptions(50)).toEqual([0, 25, 75, 100]);
    expect(getAbsorptionOptions(100)).toEqual([0, 25, 75, 100]);
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
  const PRICES = [5, 30, 45, 50, 80, 100, 120, 500];

  it("clientPrice sempre termina em ,90", () => {
    PRICES.forEach((p) => {
      [0, 25, 50, 75, 100].forEach((pct) => {
        const decimals = calculatePricing(p, pct).clientPrice.toFixed(2).split(".")[1];
        expect(decimals).toBe("90");
      });
    });
  });

  it("proReceives + platformFee = clientPrice", () => {
    PRICES.forEach((p) => {
      [0, 50, 100].forEach((pct) => {
        const { clientPrice, proReceives, platformFee } = calculatePricing(p, pct);
        expect(proReceives + platformFee).toBeCloseTo(clientPrice, 2);
      });
    });
  });

  it("taxa nunca e negativa (cliente sempre paga >= o que o pro recebe)", () => {
    PRICES.forEach((p) => {
      [0, 25, 50, 75, 100].forEach((pct) => {
        expect(calculatePricing(p, pct).platformFee).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // A REGRA: "cliente paga tudo" (0% absorcao) => o profissional recebe
  // EXATAMENTE o valor que digitou, sem perder centavos.
  it("0% absorcao => proReceives === valor digitado (exato)", () => {
    PRICES.forEach((p) => {
      expect(calculatePricing(p, 0).proReceives).toBe(p);
    });
  });

  it("proReceives nunca passa do digitado; só cai se o pro absorve", () => {
    PRICES.forEach((p) => {
      const options = getAbsorptionOptions(p);
      const receives = options.map((pct) => calculatePricing(p, pct).proReceives);
      expect(receives[0]).toBe(p); // 0% = digitado
      for (let i = 1; i < receives.length; i++) {
        expect(receives[i]).toBeLessThanOrEqual(receives[i - 1]); // mais absorcao = recebe menos
        expect(receives[i]).toBeLessThanOrEqual(p);
      }
    });
  });

  it("mais absorcao = clientPrice menor ou igual", () => {
    const prices = [0, 25, 50, 75, 100].map((pct) => calculatePricing(80, pct).clientPrice);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });

  // REGRA DO ANDRE (16/09): a taxa entra POR CIMA do que o profissional quer
  // receber (R$ 10 + 6% = R$ 10,60) e o preco sobe ate o X,90 seguinte
  // (R$ 10,90). A divisao nasce aqui e fica gravada — ninguem recalcula 6%
  // sobre os R$ 10,90 depois.
  it("valores concretos em 0% (cliente paga tudo)", () => {
    expect(calculatePricing(10, 0)).toEqual({
      clientPrice: 10.9, proReceives: 10, platformFee: 0.9, intermediaryFee: 0.4, appFee: 0.5,
    });
    expect(calculatePricing(30, 0)).toMatchObject({ clientPrice: 31.9, proReceives: 30 });
    expect(calculatePricing(50, 0)).toMatchObject({ clientPrice: 53.9, proReceives: 50 });
    expect(calculatePricing(100, 0)).toMatchObject({ clientPrice: 106.9, proReceives: 100 });
  });

  it("nunca arredonda para BAIXO: cliente >= digitado + a parte da taxa que e dele", () => {
    for (let c = 500; c <= 50000; c += 37) {
      const p = c / 100;
      getAbsorptionOptions(p).forEach((pct) => {
        const r = calculatePricing(p, pct);
        const parteDoCliente = p * 0.06 * (1 - pct / 100);
        expect(r.clientPrice + 1e-9).toBeGreaterThanOrEqual(p + parteDoCliente);
      });
    }
  });

  it("valor que ja cai em X,90 nao sobe mais um real (ruido de ponto flutuante)", () => {
    // 15 x 1,06 = 15,90 — em float vira 15,900000000000002.
    expect(calculatePricing(15, 0).clientPrice).toBe(15.9);
  });

  it("as tres partes somam o preco do cliente, centavo a centavo, e nenhuma e negativa", () => {
    for (let c = 500; c <= 50000; c += 37) {
      const p = c / 100;
      getAbsorptionOptions(p).forEach((pct) => {
        const r = calculatePricing(p, pct);
        const soma = Math.round((r.proReceives + r.intermediaryFee + r.appFee) * 100);
        expect(soma).toBe(Math.round(r.clientPrice * 100));
        expect(r.intermediaryFee).toBeGreaterThanOrEqual(0);
        // o app fica com pelo menos os 2% (menos 1 centavo de arredondamento)
        expect(Math.round(r.appFee * 100)).toBeGreaterThanOrEqual(Math.round(p * 2) - 1);
      });
    }
  });

  it("intermediador = 4% do valor digitado", () => {
    expect(calculatePricing(100, 0).intermediaryFee).toBe(4);
    expect(calculatePricing(100, 100).intermediaryFee).toBe(4);
    expect(calculatePricing(31.3, 0).intermediaryFee).toBe(1.25); // 1,252 -> 1,25
  });
});
