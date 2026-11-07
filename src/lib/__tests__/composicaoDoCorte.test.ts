import { linhasDaComposicao, marcaDoPagamento, temComposicao } from "../composicaoDoCorte";

describe("composicaoDoCorte (relatorio-explica-valores, DEC-166)", () => {
  it("modo teste: taxas riscadas com 'Não cobrada no teste' e multa para o profissional", () => {
    const l = linhasDaComposicao({
      service: 50, gateway_fee: 1.99, app_fee: 1, penalty: 5, total: 57.99, charged: false,
      goes_to: { service: "professional", penalty: "professional" },
    });
    expect(l.map((x) => x.chave)).toEqual(["service", "gateway_fee", "app_fee", "penalty", "total"]);
    const gateway = l.find((x) => x.chave === "gateway_fee")!;
    expect(gateway).toMatchObject({ riscada: true, nota: "Não cobrada no teste" });
    expect(l.find((x) => x.chave === "app_fee")).toMatchObject({ riscada: true, nota: "Não cobrada no teste" });
    expect(l.find((x) => x.chave === "penalty")).toMatchObject({ riscada: false, nota: "Vai para você" });
    expect(l.find((x) => x.chave === "total")).toMatchObject({ forte: true, valor: 57.99 });
  });

  it("charged: true: taxas normais, com o destino de cada uma", () => {
    const l = linhasDaComposicao({
      service: 50, gateway_fee: 1.99, app_fee: 1, total: 52.99, charged: true,
      goes_to: { service: "professional", gateway_fee: "gateway", app_fee: "app" },
    });
    expect(l.find((x) => x.chave === "gateway_fee")).toMatchObject({ riscada: false, nota: "Vai para a empresa de pagamento" });
    expect(l.find((x) => x.chave === "app_fee")).toMatchObject({ riscada: false, nota: "Vai para o app" });
    expect(l.find((x) => x.chave === "penalty")).toBeUndefined();
  });

  it("corte antigo sem taxas: omite as linhas que faltam; sem composicao, vazio", () => {
    const l = linhasDaComposicao({ service: 40, total: 40, charged: true });
    expect(l.map((x) => x.chave)).toEqual(["service", "total"]);
    expect(linhasDaComposicao(null)).toEqual([]);
    expect(linhasDaComposicao({})).toEqual([]);
    expect(linhasDaComposicao({ service: NaN as any, total: null })).toEqual([]);
  });

  it("PAR-6: fees_active false risca as tres taxas e tira as linhas antigas", () => {
    const l = linhasDaComposicao({
      service: 50, gateway_fee: 1.99, app_fee: 1, total: 53.9, charged: false,
      app_percent_fee: 1.08, rounding_fee: 0.74, gateway_fee_simulated: 2.08, fees_active: false,
    });
    expect(l.map((x) => x.chave)).toEqual(["service", "app_percent_fee", "rounding_fee", "gateway_fee_simulated", "total"]);
    expect(l.find((x) => x.chave === "rounding_fee")).toMatchObject({ riscada: true, nota: "Não cobrada", valor: 0.74 });
    expect(l.find((x) => x.chave === "total")).toMatchObject({ riscada: false });
  });

  it("PAR-6: fees_active true mostra as taxas sem riscar, e a multa segue igual", () => {
    const l = linhasDaComposicao({
      service: 50, penalty: 5, total: 58.9, charged: false,
      app_percent_fee: 1.08, rounding_fee: 0.74, gateway_fee_simulated: 2.08, fees_active: true,
    });
    expect(l.find((x) => x.chave === "app_percent_fee")).toMatchObject({ riscada: false, nota: null });
    expect(l.find((x) => x.chave === "penalty")).toMatchObject({ riscada: false, valor: 5 });
  });

  it("temComposicao", () => {
    expect(temComposicao(null)).toBe(false);
    expect(temComposicao([{ composition: null }])).toBe(false);
    expect(temComposicao([{ composition: { total: 10 } }])).toBe(true);
  });

  it("marca do pagamento: declarado ate o cliente confirmar; contestado vale mais", () => {
    expect(marcaDoPagamento({})).toBeNull();
    expect(marcaDoPagamento({ payment_declared: false })).toBeNull();
    expect(marcaDoPagamento({ payment_declared: true })).toMatchObject({ texto: "Declarado por você", contestado: false });
    expect(marcaDoPagamento({ payment_declared: true, payment_contested: true })).toMatchObject({ contestado: true });
    expect(temComposicao([{ payment_declared: true }])).toBe(true);
  });
});
