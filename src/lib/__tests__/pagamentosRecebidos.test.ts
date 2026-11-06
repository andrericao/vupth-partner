import { api } from "@lib/api";
import {
  linhaDoPagamento,
  meusPagamentos,
  pagamentosParaMostrar,
  type PagamentoRecebido,
} from "@lib/pagamentosRecebidos";

jest.mock("@lib/api", () => ({ api: { get: jest.fn() } }));

const P: PagamentoRecebido = {
  id: "p1",
  campaign_name: "Teste de Lançamento",
  type: "PAYMENT",
  amount: "5.00",
  paid_at: "2026-11-06T14:30:00-03:00",
  note: "PIX 123",
  reversed: false,
};

describe("pagamentosRecebidos", () => {
  it("le GET /referrals/me/payments", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: [P] });
    expect(await meusPagamentos()).toEqual([P]);
    expect(api.get).toHaveBeenCalledWith("/referrals/me/payments");
  });

  it("sem endpoint ou resposta estranha: lista vazia", async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error("404"));
    expect(await meusPagamentos()).toEqual([]);
    (api.get as jest.Mock).mockResolvedValueOnce({ data: null });
    expect(await meusPagamentos()).toEqual([]);
  });

  it("mostra so os pagamentos, sem a linha do estorno", () => {
    expect(pagamentosParaMostrar([P, { ...P, id: "p2", type: "REVERSAL" }])).toEqual([P]);
  });

  it("monta a linha com pago em dd/mm e a nota", () => {
    expect(linhaDoPagamento(P)).toEqual({
      titulo: "Teste de Lançamento",
      valor: expect.stringContaining("5,00"),
      estado: "pago em 06/11",
      nota: "PIX 123",
    });
  });

  it("estornado avisa na linha; sem campanha, data ou nota usa o padrao", () => {
    expect(linhaDoPagamento({ ...P, reversed: true }).estado).toBe("pago em 06/11 · estornado");
    const l = linhaDoPagamento({ ...P, campaign_name: null, paid_at: "x", note: " " });
    expect(l).toMatchObject({ titulo: "Prêmios de indicação", estado: "pago", nota: null });
    expect(linhaDoPagamento({ ...P, paid_at: null }).estado).toBe("pago");
  });
});
