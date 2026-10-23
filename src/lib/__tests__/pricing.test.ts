import {
  calculatePricing,
  roundTo90,
  ceilTo90,
  getAbsorptionOptions,
  estimateDesiredFromClient,
  passaNaProvaReal,
  precoParaReceber,
  taxaDoGateway,
  taxaDoGatewayEmCentavos,
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

  // preco-sobre-o-total (DEC-54, Andre 15/10): os exemplos do Backend (3e382fa).
  it("valores concretos em 0% (cliente paga tudo) — iguais ao PriceSplit do Backend", () => {
    expect(calculatePricing(30, 0)).toEqual({
      clientPrice: 32.9, proReceives: 30, platformFee: 2.9, intermediaryFee: 1.99, appFee: 0.91,
    });
    expect(calculatePricing(50, 0)).toMatchObject({ clientPrice: 53.9, proReceives: 50, intermediaryFee: 2.11 });
    expect(calculatePricing(80, 0)).toMatchObject({ clientPrice: 84.9, proReceives: 80 });
    expect(calculatePricing(100, 0)).toMatchObject({ clientPrice: 105.9, proReceives: 100, intermediaryFee: 3.66 });
  });

  it("30 absorvendo tudo (1,80) -> 30,90", () => {
    expect(calculatePricing(30, 100)).toMatchObject({ clientPrice: 30.9, proReceives: 28.2 });
  });

  it("prova real em todo preco: cliente - gateway - 2% (do preco) >= o que o profissional recebe", () => {
    for (let c = 500; c <= 50000; c += 37) {
      const p = c / 100;
      getAbsorptionOptions(p).forEach((pct) => {
        const r = calculatePricing(p, pct);
        expect(passaNaProvaReal(Math.round(r.clientPrice * 100), Math.round(r.proReceives * 100))).toBe(true);
      });
    }
  });

  it("e o MENOR X,90 que passa na prova real", () => {
    for (let c = 500; c <= 50000; c += 37) {
      const recebe = c;
      const preco = precoParaReceber(recebe);
      expect(preco % 100).toBe(90);
      expect(passaNaProvaReal(preco, recebe)).toBe(true);
      expect(passaNaProvaReal(preco - 100, recebe)).toBe(false);
    }
  });

  it("as tres partes somam o preco do cliente, centavo a centavo, e nenhuma e negativa", () => {
    for (let c = 500; c <= 50000; c += 37) {
      const p = c / 100;
      getAbsorptionOptions(p).forEach((pct) => {
        const r = calculatePricing(p, pct);
        const soma = Math.round((r.proReceives + r.intermediaryFee + r.appFee) * 100);
        expect(soma).toBe(Math.round(r.clientPrice * 100));
        expect(r.intermediaryFee).toBeGreaterThanOrEqual(0);
        // o app fica com pelo menos os 2% do preco (a prova real garante)
        expect(Math.round(r.appFee * 100)).toBeGreaterThanOrEqual(Math.floor((Math.round(r.clientPrice * 100) * 2 + 50) / 100));
      });
    }
  });

  // taxa-fixa-pelo-pior-caso (DEC-91, Backend 8cdbeb9): os mesmos casos do Backend.
  it("o preco do cliente para quem digita 10, 15, 20, 30, 50, 80 e 100", () => {
    const esperado: Record<number, number> = { 10: 12.9, 15: 17.9, 20: 22.9, 30: 32.9, 50: 53.9, 80: 84.9, 100: 105.9 };
    for (const [digitado, preco] of Object.entries(esperado)) {
      expect(calculatePricing(Number(digitado), 0).clientPrice).toBe(preco);
    }
  });

  it("intermediador = max(R$ 1,99; R$ 0,49 + 2,99% do PRECO), centavo para cima", () => {
    expect(calculatePricing(100, 0).intermediaryFee).toBe(3.66); // 0,49 + 2,99% de 105,90 = 3,6564 -> 3,66
    expect(calculatePricing(100, 100).intermediaryFee).toBe(3.48); // preco 99,90
    expect(calculatePricing(10, 0).intermediaryFee).toBe(1.99); // o fixo do Pix
  });

  it("a taxa do gateway: Pix ate a virada, cartao depois (~R$ 50,17)", () => {
    expect(taxaDoGatewayEmCentavos(1290)).toBe(199);
    expect(taxaDoGatewayEmCentavos(5010)).toBe(199); // 0,49 + 1,498 = 1,99 (arredondado para cima)
    expect(taxaDoGatewayEmCentavos(5390)).toBe(211);
    expect(taxaDoGateway(105.9)).toBe(3.66);
  });

  it("varredura R$ 5 a R$ 500: a taxa cobrada cobre o Pix e o credito a vista, e a conta fecha", () => {
    for (let c = 500; c <= 50000; c += 100) {
      const r = calculatePricing(c / 100, 0);
      const preco = Math.round(r.clientPrice * 100);
      expect(taxaDoGatewayEmCentavos(preco)).toBeGreaterThanOrEqual(199);
      expect(taxaDoGatewayEmCentavos(preco)).toBeGreaterThanOrEqual(Math.ceil(49 + (preco * 299) / 10000));
      expect(r.proReceives).toBe(c / 100);
    }
  });

  // preco-baixo-pelo-pior-caso (Andre, 22/10): serviço de qualquer valor, inclusive
  // abaixo de R$ 30, pela mesma conta do PriceSplit.clientPriceFor do Backend.
  it("varredura de R$ 0,01 a R$ 29,99, centavo a centavo: nunca barra, o preco termina em ,90 e a prova real passa", () => {
    for (let c = 1; c <= 2999; c++) {
      const r = calculatePricing(c / 100, 0);
      const preco = Math.round(r.clientPrice * 100);
      expect(preco % 100).toBe(90);
      expect(r.proReceives).toBe(c / 100);
      expect(passaNaProvaReal(preco, c)).toBe(true);
      // o menor X,90 que passa: um real a menos nao passa
      if (preco - 100 > 0) expect(passaNaProvaReal(preco - 100, c)).toBe(false);
      expect(Math.round(r.intermediaryFee * 100)).toBe(taxaDoGatewayEmCentavos(preco));
      expect(Math.round((r.proReceives + r.platformFee) * 100)).toBe(preco);
      expect(r.appFee).toBeGreaterThanOrEqual(0);
    }
  });

  it("R$ 1,99 (o Pix) e R$ 0,01: o cliente paga o X,90 que cobre o pior caso", () => {
    expect(calculatePricing(0.01, 0).clientPrice).toBe(2.9);
    expect(calculatePricing(1.99, 0).clientPrice).toBe(4.9);
    expect(calculatePricing(29.99, 0).clientPrice).toBe(32.9);
  });
});
