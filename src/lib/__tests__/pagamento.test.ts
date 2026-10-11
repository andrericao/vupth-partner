import { api } from "@lib/api";
import {
  perguntarPagamento,
  mensagemDoFim,
  obterPagamentosPendentes,
  confirmarRecebimento,
  isPaymentEvent,
  observacaoDoPagamento,
} from "@lib/pagamento";

jest.mock("@lib/api", () => ({ api: { get: jest.fn(), post: jest.fn() } }));

// pagamento-pix (adendos 1a0616c e 62295f1): antes do Finalizar ou do Iniciar
// proximo, o app le o pagamento. PAID -> sem pergunta; PENDING ou
// AWAITING_CONFIRMATION -> "O pagamento foi efetuado?".
describe("perguntarPagamento", () => {
  beforeEach(() => jest.resetAllMocks());
  const pergunta = jest.fn();

  it("ja pago: nao pergunta e nao manda resposta", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { status: "PAID", amount: 31.9 } });
    await expect(perguntarPagamento("a1", { perguntar: pergunta })).resolves.toBeUndefined();
    expect(api.get).toHaveBeenCalledWith("/attendances/a1/payment");
    expect(pergunta).not.toHaveBeenCalled();
  });

  it("pendente: pergunta com o valor; Sim = true, Nao = false", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { status: "PENDING", amount: 31.9 } });
    pergunta.mockResolvedValueOnce(true);
    await expect(perguntarPagamento("a1", { perguntar: pergunta })).resolves.toBe(true);
    expect(pergunta).toHaveBeenCalledWith(expect.objectContaining({ mensagem: expect.stringContaining("R$ 31,90") }));
    pergunta.mockResolvedValueOnce(false);
    await expect(perguntarPagamento("a1", { perguntar: pergunta })).resolves.toBe(false);
  });

  it("o cliente disse que pagou: a pergunta pede para conferir", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { status: "AWAITING_CONFIRMATION", amount: 45 } });
    pergunta.mockResolvedValueOnce(true);
    await perguntarPagamento("a1", { perguntar: pergunta });
    expect(pergunta).toHaveBeenCalledWith(expect.objectContaining({ mensagem: expect.stringMatching(/diz que pagou/) }));
  });

  it("sem pagamento (atendimento antigo, 409) ou falha de rede: finaliza como antes, sem perguntar", async () => {
    (api.get as jest.Mock).mockRejectedValueOnce({ response: { status: 409 } });
    await expect(perguntarPagamento("a1", { perguntar: pergunta })).resolves.toBeUndefined();
    (api.get as jest.Mock).mockRejectedValueOnce(new Error("rede"));
    await expect(perguntarPagamento("a1", { perguntar: pergunta })).resolves.toBeUndefined();
    expect(pergunta).not.toHaveBeenCalled();
  });
});

describe("mensagemDoFim", () => {
  it("pago: a mensagem fica na tela (o backend nao manda push a quem tocou)", () => {
    expect(mensagemDoFim("PAID")).toBe("Atendimento concluído e pago.");
  });
  it("pendente: avisa que fica aguardando", () => {
    expect(mensagemDoFim("PENDING")).toMatch(/aguardando o pagamento/);
    expect(mensagemDoFim("AWAITING_CONFIRMATION")).toMatch(/aguardando o pagamento/);
  });
  it("sem status: nada a dizer", () => {
    expect(mensagemDoFim(undefined)).toBeNull();
    expect(mensagemDoFim(null)).toBeNull();
  });
});

describe("pagamentos pendentes do profissional (adendo 1a0616c)", () => {
  beforeEach(() => jest.resetAllMocks());

  it("le GET /professional/me/pending-payments", async () => {
    const dados = { awaiting_count: 1, items: [{ attendance_id: "a1", status: "AWAITING_CONFIRMATION" }] };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: dados });
    await expect(obterPagamentosPendentes()).resolves.toEqual(dados);
    expect(api.get).toHaveBeenCalledWith("/professional/me/pending-payments");
  });

  it("resposta vazia vira zero e lista vazia", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: null });
    await expect(obterPagamentosPendentes()).resolves.toEqual({ awaiting_count: 0, items: [] });
  });

  it("Recebi: POST /attendances/{id}/payment/confirm", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({});
    await confirmarRecebimento("a1");
    expect(api.post).toHaveBeenCalledWith("/attendances/a1/payment/confirm");
  });

  it("os eventos do WS de pagamento (PAYMENT_CLAIMED, PAYMENT_CONFIRMED)", () => {
    expect(isPaymentEvent("PAYMENT_CLAIMED")).toBe(true);
    expect(isPaymentEvent("PAYMENT_CONFIRMED")).toBe(true);
    expect(isPaymentEvent("CUT_REQUESTED")).toBe(false);
    expect(isPaymentEvent(undefined)).toBe(false);
  });

  it("a observacao embaixo do card (Andre, 10/10)", () => {
    expect(observacaoDoPagamento("AWAITING_CONFIRMATION")).toBe("Confirme se o pagamento foi efetuado");
    expect(observacaoDoPagamento("PENDING")).toBe("Aguardando o cliente efetuar o pagamento");
  });
});
