import { ARTIGO_DO_PRECO, explicarPrecoDoServico, linkDoSaibaMaisDoPreco } from "../politicaDePreco";

const mockAbrir = jest.fn();
jest.mock("@lib/suporte", () => ({
  ...jest.requireActual("@lib/suporte"),
  abrirLink: (u: string) => mockAbrir(u),
}));

describe("trocar-url-do-artigo (Suporte S54, DEC-96)", () => {
  beforeEach(() => jest.clearAllMocks());

  // A URL inteira, escrita a mao: se alguem mexer em SUPORTE_URL ou no caminho,
  // este teste pega antes de o "Saiba mais" levar a uma pagina que nao existe.
  it("o Saiba mais abre o artigo do Parceiro no Suporte, nao a home do profissional", async () => {
    await explicarPrecoDoServico();
    expect(mockAbrir).toHaveBeenCalledTimes(1);
    expect(mockAbrir).toHaveBeenCalledWith(
      "https://vupth-support.pages.dev/artigos/parceiro/por-que-o-preco-muda.html",
    );
    expect(mockAbrir.mock.calls[0][0]).not.toMatch(/\/profissional$/);
  });

  it("o link e o da constante, sem Asaas no caminho", () => {
    expect(linkDoSaibaMaisDoPreco()).toBe(ARTIGO_DO_PRECO);
    expect(linkDoSaibaMaisDoPreco()).not.toMatch(/asaas/i);
  });
});
