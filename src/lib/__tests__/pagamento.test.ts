import { api } from "@lib/api";
import { perguntarPagamento, mensagemDoFim } from "@lib/pagamento";

jest.mock("@lib/api", () => ({ api: { get: jest.fn() } }));

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
