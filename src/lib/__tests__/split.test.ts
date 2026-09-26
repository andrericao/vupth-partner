import { corpoDoSplit, precoParaEditar, avisoSemSplit, ERRO_SPLIT } from "@lib/split";
import { calculatePricing } from "@lib/pricing";

// Relatorio sem os 6% (bloqueava a publicacao). Contrato do backend, no ar em
// PROD desde 18/09: o cadastro manda `price` (o que o cliente paga),
// `pro_receives` e `base_price` (o valor digitado); o backend confere a mesma
// conta do calculatePricing e grava a divisao. Servico sem divisao = legado.
describe("corpoDoSplit", () => {
  it("manda os tres numeros da mesma conta do preview", () => {
    const p = calculatePricing(100, 25);
    expect(corpoDoSplit(100, 25)).toEqual({
      price: p.clientPrice,
      pro_receives: p.proReceives,
      base_price: 100,
    });
  });

  it("R$ 10 sem absorcao: cliente 10,90, recebe 10", () => {
    expect(corpoDoSplit(10, 0)).toEqual({ price: 10.9, pro_receives: 10, base_price: 10 });
  });
});

describe("precoParaEditar", () => {
  it("servico com divisao gravada: volta o digitado e a absorcao escolhida", () => {
    const p = calculatePricing(100, 75);
    expect(
      precoParaEditar({ price: p.clientPrice, base_price: 100, pro_receives: p.proReceives })
    ).toEqual({ digitado: 100, absorcao: 75, legado: false });
  });

  it("absorcao gravada fora das opcoes cai na opcao mais proxima", () => {
    // 100 com 6% = 6 de taxa; absorvido 2,90 = 48%. Acima de R$ 50 as opcoes sao 0/25/75/100.
    expect(precoParaEditar({ price: 104.9, base_price: 100, pro_receives: 97.1 }).absorcao).toBe(25);
  });

  it("servico legado (sem divisao): estima o digitado e avisa que e legado", () => {
    const r = precoParaEditar({ price: 105.9, base_price: null, pro_receives: null });
    expect(r.legado).toBe(true);
    expect(r.absorcao).toBe(0);
    expect(r.digitado).toBeGreaterThan(0);
  });
});

describe("avisoSemSplit", () => {
  it("sem atendimento legado: nada", () => {
    expect(avisoSemSplit(0)).toBeNull();
    expect(avisoSemSplit(undefined)).toBeNull();
  });

  it("com legado: diz quantos ficaram fora do liquido", () => {
    expect(avisoSemSplit(1)).toMatch(/1 atendimento/);
    expect(avisoSemSplit(3)).toMatch(/3 atendimentos/);
  });
});

it("o codigo do 422 do backend", () => {
  expect(ERRO_SPLIT).toBe("SERVICE_PRICE_SPLIT_INVALID");
});
