import { explicarPrecoDoServico, linkDoSaibaMaisDoPreco } from "../politicaDePreco";

const mockAbrir = jest.fn();
jest.mock("@lib/suporte", () => ({
  abrirLink: (u: string) => mockAbrir(u),
  linkDoSuporte: (p: string) => `https://suporte/${p}`,
}));

describe("saiba-mais-leva-ao-suporte (DEC-96)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("o Saiba mais abre so o Suporte do profissional", async () => {
    await explicarPrecoDoServico();
    expect(mockAbrir).toHaveBeenCalledTimes(1);
    expect(mockAbrir).toHaveBeenCalledWith("https://suporte/profissional");
  });

  it("o app nao aponta direto para o Asaas", () => {
    expect(linkDoSaibaMaisDoPreco()).not.toMatch(/asaas/i);
  });
});
