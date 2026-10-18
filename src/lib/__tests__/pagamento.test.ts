import { api } from "@lib/api";
import {
  perguntarPagamento,
  mensagemDoFim,
  obterPagamentosPendentes,
  confirmarRecebimento,
  isPaymentEvent,
  observacaoDoPagamento,
  rotuloDoPagamento,
} from "@lib/pagamento";

jest.mock("@lib/api", () => ({ api: { get: jest.fn(), post: jest.fn() } }));
const mockConfirmar = jest.fn();
jest.mock("@lib/confirmar", () => ({ confirmar: (...a: unknown[]) => mockConfirmar(...a) }));

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

  it("sem deps, usa a caixa de confirmacao do app; sem valor, mostra R$ 0,00", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { status: "PENDING" } });
    mockConfirmar.mockResolvedValueOnce(false);
    await expect(perguntarPagamento("a1")).resolves.toBe(false);
    expect(mockConfirmar).toHaveBeenCalledWith(expect.objectContaining({ mensagem: expect.stringContaining("R$ 0,00") }));
  });

  it("resposta vazia: nao pergunta", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: null });
    await expect(perguntarPagamento("a1", { perguntar: pergunta })).resolves.toBeUndefined();
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
    // sem a forma, sem corpo: continua valendo como antes (Backend 8b158e3)
    expect(api.post).toHaveBeenCalledWith("/attendances/a1/payment/confirm", undefined);
  });

  it("com a forma, manda o method no corpo", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({});
    await confirmarRecebimento("a1", "PIX");
    expect(api.post).toHaveBeenCalledWith("/attendances/a1/payment/confirm", { method: "PIX" });
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

describe("rotuloDoPagamento (adendo 62295f1: ao lado de qualquer status)", () => {
  it("pago, aguardando ou a confirmar", () => {
    expect(rotuloDoPagamento("PAID")).toBe("pago");
    expect(rotuloDoPagamento("PENDING")).toBe("aguardando pagamento");
    expect(rotuloDoPagamento("AWAITING_CONFIRMATION")).toBe("pagamento a confirmar");
  });
  it("sem pagamento (antigos, cancelados, retirados): nada", () => {
    expect(rotuloDoPagamento(null)).toBeNull();
    expect(rotuloDoPagamento(undefined)).toBeNull();
    expect(rotuloDoPagamento("OUTRO")).toBeNull();
  });
});

// forma-de-recebimento (Backend 8b158e3): so registro, opcional.
describe("forma de recebimento", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { perguntarForma, FORMAS_DE_RECEBIMENTO } = require("@lib/pagamento");

  it("tem as quatro formas do Backend", () => {
    expect(FORMAS_DE_RECEBIMENTO.map((f: { valor: string }) => f.valor)).toEqual([
      "PIX",
      "CARTAO",
      "DINHEIRO",
      "NOTA",
    ]);
  });

  it("devolve a forma escolhida; pular devolve undefined", async () => {
    expect(await perguntarForma({ perguntar: async () => 1 })).toBe("CARTAO");
    expect(await perguntarForma({ perguntar: async () => 3 })).toBe("NOTA");
    expect(await perguntarForma({ perguntar: async () => 4 })).toBeUndefined();
  });

  it("a caixa tem as quatro formas e o Pular", async () => {
    let botoes: { texto: string }[] = [];
    await perguntarForma({
      perguntar: async (p: { botoes: { texto: string }[] }) => {
        botoes = p.botoes;
        return 4;
      },
    });
    expect(botoes.map((b) => b.texto)).toEqual(["Pix", "Cartão", "Dinheiro", "Nota", "Pular"]);
  });
});
