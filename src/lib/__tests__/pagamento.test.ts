import { api } from "@lib/api";
import {
  perguntarPagamento,
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
// AWAITING_CONFIRMATION -> "Recebeu o pagamento?".
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

  // recebi-ao-finalizar-corte (Andre, 25/10): a pergunta aparece sempre que o pagamento segue
  // pendente, com ou sem Asaas; com o nome do cliente quando se sabe.
  it("mostra o nome do cliente e o valor; Confirmar = true, Nao recebi = false", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { status: "PENDING", amount: 31.9 } });
    pergunta.mockResolvedValueOnce(true);
    await expect(perguntarPagamento("a1", { perguntar: pergunta, cliente: "Ana" })).resolves.toBe(true);
    expect(pergunta).toHaveBeenCalledWith(
      expect.objectContaining({ mensagem: "Ana · R$ 31,90. Se ainda não, fica pendente.", confirmar: "Recebi", cancelar: "Não recebi" })
    );
    pergunta.mockResolvedValueOnce(false);
    await expect(perguntarPagamento("a1", { perguntar: pergunta, cliente: "Ana" })).resolves.toBe(false);
    expect(api.post).not.toHaveBeenCalled();
  });

  it("'Nao recebi' diante do 'ja paguei' do cliente recusa o pagamento (volta a pendente)", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { status: "AWAITING_CONFIRMATION", amount: 45 } });
    (api.post as jest.Mock).mockResolvedValue({});
    pergunta.mockResolvedValueOnce(false);
    await expect(perguntarPagamento("a1", { perguntar: pergunta, cliente: "Bia" })).resolves.toBe(false);
    expect(api.post).toHaveBeenCalledWith("/attendances/a1/payment/refuse");
    expect(pergunta).toHaveBeenCalledWith(expect.objectContaining({ mensagem: "Bia diz que pagou R$ 45,00. Confira no seu banco." }));
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

// GUIA_DE_TEXTO.md §4.8 e §1 ("Como se verifica"): botão de uma palavra, título
// que diz o fato, corpo de uma linha (até 70 caracteres), nunca "Sim, ...".
describe("a pergunta do pagamento segue o guia de texto", () => {
  beforeEach(() => jest.resetAllMocks());
  const pergunta = jest.fn();
  const palavras = (texto: string) => texto.trim().split(/\s+/).length;

  it("pendente: Recebeu o pagamento? / R$ X. Se ainda não, fica pendente. / Recebi · Não recebi", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { status: "PENDING", amount: 31.9 } });
    pergunta.mockResolvedValue(true);
    await perguntarPagamento("a1", { perguntar: pergunta });
    const texto = pergunta.mock.calls[0][0];
    expect(texto).toEqual({
      titulo: "Recebeu o pagamento?",
      mensagem: "R$ 31,90. Se ainda não, fica pendente.",
      confirmar: "Recebi",
      cancelar: "Não recebi",
    });
    expect(texto.mensagem.length).toBeLessThanOrEqual(70);
    expect(palavras(texto.confirmar)).toBe(1);
    expect(palavras(texto.cancelar)).toBeLessThanOrEqual(2);
    expect(texto.confirmar).not.toMatch(/^Sim/);
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
  const { perguntarForma, FORMAS_DE_RECEBIMENTO, MOSTRAR_FORMA_NOTA, formasVisiveis } = require("@lib/pagamento");

  it("tem as quatro formas do Backend", () => {
    expect(FORMAS_DE_RECEBIMENTO.map((f: { valor: string }) => f.valor)).toEqual([
      "PIX",
      "CARTAO",
      "DINHEIRO",
      "NOTA",
    ]);
  });

  // ocultar-forma-nota (Andre, 25/10): a Nota esta escondida (flag), sem apagar.
  it("a Nota esta escondida da caixa, mas continua na lista do Backend", () => {
    expect(MOSTRAR_FORMA_NOTA).toBe(false);
    expect(formasVisiveis().map((f: { valor: string }) => f.valor)).toEqual(["PIX", "CARTAO", "DINHEIRO"]);
    expect(FORMAS_DE_RECEBIMENTO.map((f: { valor: string }) => f.valor)).toContain("NOTA");
  });

  it("devolve a forma escolhida; pular devolve undefined", async () => {
    expect(await perguntarForma({ perguntar: async () => 1 })).toBe("CARTAO");
    expect(await perguntarForma({ perguntar: async () => 2 })).toBe("DINHEIRO");
    expect(await perguntarForma({ perguntar: async () => 3 })).toBeUndefined();
  });

  it("a caixa tem Pix, Cartao e Dinheiro e o Pular (sem Nota)", async () => {
    let botoes: { texto: string }[] = [];
    await perguntarForma({
      perguntar: async (p: { botoes: { texto: string }[] }) => {
        botoes = p.botoes;
        return 3;
      },
    });
    expect(botoes.map((b) => b.texto)).toEqual(["Pix", "Cartão", "Dinheiro", "Pular"]);
  });
});
