import { api } from "@lib/api";
import { meuLinkDeIndicacao, clientesQueChegaram } from "@lib/indicacao";

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
});
