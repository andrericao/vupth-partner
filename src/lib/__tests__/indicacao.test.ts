import { api } from "@lib/api";
import { meuLinkDeIndicacao, clientesQueChegaram, aReceber } from "@lib/indicacao";

jest.mock("@lib/api", () => ({ api: { get: jest.fn() } }));

// link-de-indicacao (DEC-70, Backend 3fdcec1).
describe("indicacao", () => {
  it("pede o link em GET /referrals/me", async () => {
    const dado = { code: "ABC234", link: "https://vupth.pages.dev/i/ABC234", referred_clients: 2 };
    (api.get as jest.Mock).mockResolvedValue({ data: dado });
    await expect(meuLinkDeIndicacao()).resolves.toEqual(dado);
    expect(api.get).toHaveBeenCalledWith("/referrals/me");
  });

  it("a frase dos clientes que chegaram", () => {
    expect(clientesQueChegaram(0)).toBe("Nenhum cliente chegou pelo seu link ainda.");
    expect(clientesQueChegaram(1)).toBe("1 cliente chegou pelo seu link.");
    expect(clientesQueChegaram(3)).toBe("3 clientes chegaram pelo seu link.");
  });

  // a-receber-da-indicacao (Backend e5dc2e8).
  it("o a receber: quantos concluiram e o valor", () => {
    expect(aReceber({ credited_clients: 2, to_receive: 10 })).toBe("2 concluíram o corte · R$ 10,00 a receber");
    expect(aReceber({ credited_clients: 1, to_receive: "5.5" })).toBe("1 concluiu o corte · R$ 5,50 a receber");
    expect(aReceber({ credited_clients: 0, to_receive: null })).toBe("0 concluíram o corte · R$ 0,00 a receber");
    expect(aReceber({ credited_clients: 1, to_receive: "x" })).toBe("1 concluiu o corte · R$ 0,00 a receber");
  });

  it("Backend antigo, sem os campos: sem a linha", () => {
    expect(aReceber({})).toBeNull();
    expect(aReceber({ credited_clients: null })).toBeNull();
  });
});
