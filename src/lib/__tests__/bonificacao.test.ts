import { api } from "@lib/api";
import {
  FLAG_COM_DESCONTO,
  buscarCalculo,
  buscarCalculoComPrazo,
  linhasDoCalculo,
  perguntarValorRecebido,
  saldosDoRelatorio,
  textoDoCalculo,
  type Calculo,
} from "../bonificacao";

jest.mock("@lib/api", () => ({ api: { get: jest.fn() } }));

// recebi-mostra-cliente-e-app (DEC-127, Backend 2fed6f5): corte R$ 32,90, desconto R$ 10,00,
// o cliente paga R$ 22,90; o profissional estipulou R$ 30,00 e o app cobre a diferenca, R$ 7,10.
const COM_DESCONTO: Calculo = {
  discounted: true,
  list_price: 32.9,
  discount: 10,
  penalties: 0,
  client_pays: 22.9,
  pro_receives: 30,
  app_pays: 7.1,
  received_amount: 22.9,
  net_to_professional: 7.1,
};

describe("linhasDoCalculo", () => {
  it("sem desconto: nada (o fluxo segue como era)", () => {
    expect(linhasDoCalculo({ discounted: false })).toEqual([]);
    expect(linhasDoCalculo(null)).toEqual([]);
    expect(textoDoCalculo(undefined)).toBe("");
  });

  it("com desconto: corte, desconto, cliente (sem multa), voce recebe e o que o app cobre", () => {
    expect(linhasDoCalculo(COM_DESCONTO)).toEqual([
      { rotulo: "Valor do corte", valor: "R$ 32,90" },
      { rotulo: "Desconto", valor: "-R$ 10,00" },
      { rotulo: "Cliente paga (sem multa)", valor: "R$ 22,90" },
      { rotulo: "Você recebe", valor: "R$ 30,00" },
      { rotulo: "O app cobre", valor: "R$ 7,10" },
    ]);
  });

  it("com multa: a linha da multa entra e o cliente paga 'com multa'", () => {
    const l = linhasDoCalculo({ ...COM_DESCONTO, penalties: 5, client_pays: 27.9 });
    expect(l.map((x) => x.rotulo)).toContain("Multa");
    expect(l.find((x) => x.rotulo.startsWith("Cliente paga"))).toEqual({ rotulo: "Cliente paga (com multa)", valor: "R$ 27,90" });
  });

  it("o que o app cobre some quando e zero", () => {
    const l = linhasDoCalculo({ ...COM_DESCONTO, app_pays: null });
    expect(l.map((x) => x.rotulo)).not.toContain("O app cobre");
    expect(linhasDoCalculo({ ...COM_DESCONTO, app_pays: 0 }).map((x) => x.rotulo)).not.toContain("O app cobre");
  });

  it("o calculo bate: corte - desconto + multa = cliente paga", () => {
    const b = { ...COM_DESCONTO, penalties: 5, client_pays: 27.9 };
    expect(b.list_price! - b.discount! + b.penalties).toBeCloseTo(b.client_pays!, 2);
  });

  it("o texto da caixa abre com a flag", () => {
    const t = textoDoCalculo(COM_DESCONTO);
    expect(t.split("\n")[0]).toBe(FLAG_COM_DESCONTO);
    expect(t).toContain("Valor do corte: R$ 32,90");
  });
});

describe("buscarCalculo", () => {
  beforeEach(() => jest.resetAllMocks());
  it("devolve o calculo quando ha desconto", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { breakdown: COM_DESCONTO } });
    expect(await buscarCalculo("a1")).toEqual(COM_DESCONTO);
    expect(api.get).toHaveBeenCalledWith("/attendances/a1/payment");
  });
  it("null sem desconto, sem breakdown ou com falha", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { breakdown: { discounted: false } } });
    expect(await buscarCalculo("a1")).toBeNull();
    (api.get as jest.Mock).mockResolvedValueOnce({ data: {} });
    expect(await buscarCalculo("a1")).toBeNull();
    (api.get as jest.Mock).mockRejectedValueOnce(new Error("x"));
    expect(await buscarCalculo("a1")).toBeNull();
  });
});

describe("perguntarValorRecebido", () => {
  it("sem desconto: nao pergunta", async () => {
    const perguntar = jest.fn();
    expect(await perguntarValorRecebido("a1", { buscar: async () => null, perguntar })).toBeUndefined();
    expect(perguntar).not.toHaveBeenCalled();
  });
  it("com desconto: o padrao (valor com desconto) vai sem received_amount", async () => {
    const perguntar = jest.fn().mockResolvedValue(0);
    expect(await perguntarValorRecebido("a1", { buscar: async () => COM_DESCONTO, perguntar })).toBeUndefined();
    expect(perguntar.mock.calls[0][0].botoes.map((b: { texto: string }) => b.texto)).toEqual([
      "R$ 22,90 (com desconto)",
      "R$ 32,90 (valor cheio)",
    ]);
  });
  it("pagou o cheio: informa corte + multa", async () => {
    const perguntar = jest.fn().mockResolvedValue(1);
    const b = { ...COM_DESCONTO, penalties: 5, client_pays: 27.9 };
    expect(await perguntarValorRecebido("a1", { buscar: async () => b, perguntar })).toBeCloseTo(37.9, 2);
  });
  it("desconto que nao muda o valor: nao pergunta", async () => {
    const perguntar = jest.fn();
    const b = { ...COM_DESCONTO, list_price: 22.9, client_pays: 22.9 };
    expect(await perguntarValorRecebido("a1", { buscar: async () => b, perguntar })).toBeUndefined();
    expect(perguntar).not.toHaveBeenCalled();
  });
});

describe("saldosDoRelatorio", () => {
  it("backend antigo ou tudo zero: null", () => {
    expect(saldosDoRelatorio(null)).toBeNull();
    expect(saldosDoRelatorio({})).toBeNull();
    expect(saldosDoRelatorio({ to_receive_total: 0, to_pay_total: 0, net_total: 0 })).toBeNull();
  });
  it("devolve a receber, a pagar e o liquido", () => {
    expect(saldosDoRelatorio({ to_receive_total: 7.1, to_pay_total: 2.9, net_total: 4.2 })).toEqual({ aReceber: 7.1, aPagar: 2.9, saldo: 4.2 });
  });
  it("sem net_total: calcula receber - pagar", () => {
    expect(saldosDoRelatorio({ to_receive_total: 10, to_pay_total: 4 })?.saldo).toBe(6);
  });
});

describe("buscarCalculoComPrazo", () => {
  afterEach(() => jest.useRealTimers());
  it("rede rapida: devolve o calculo", async () => {
    expect(await buscarCalculoComPrazo("a1", 2000, async () => COM_DESCONTO)).toEqual(COM_DESCONTO);
  });
  it("rede lenta: passou do prazo, segue sem o calculo (nao segura a tela)", async () => {
    jest.useFakeTimers();
    const lenta = () => new Promise<Calculo | null>(() => {});
    const p = buscarCalculoComPrazo("a1", 2000, lenta);
    await jest.advanceTimersByTimeAsync(2000);
    expect(await p).toBeNull();
  });
});
