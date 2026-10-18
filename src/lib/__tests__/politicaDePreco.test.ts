import { explicarPrecoDoServico, ASAAS_TAXAS_URL, SAIBA_MAIS_PRECO } from "../politicaDePreco";

const mockEscolher = jest.fn();
jest.mock("@lib/confirmar", () => ({ escolherOpcao: (...a: unknown[]) => mockEscolher(...a) }));
const mockAbrir = jest.fn();
jest.mock("@lib/suporte", () => ({
  abrirLink: (u: string) => mockAbrir(u),
  linkDoSuporte: (p: string) => `https://suporte/${p}`,
}));

describe("politica-de-preco-saiba-mais (DEC-91)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("a explicacao diz a taxa do Asaas e os 2% do app, sem prometer valor fixo de venda", () => {
    expect(SAIBA_MAIS_PRECO.mensagem).toMatch(/R\$ 1,99/);
    expect(SAIBA_MAIS_PRECO.mensagem).toMatch(/2,99%/);
    expect(SAIBA_MAIS_PRECO.mensagem).toMatch(/2%/);
  });

  it("oferece o site do Asaas e o Suporte", async () => {
    mockEscolher.mockResolvedValue(null);
    await explicarPrecoDoServico();
    const { opcoes } = mockEscolher.mock.calls[0][0];
    expect(opcoes.map((o: { texto: string }) => o.texto)).toEqual(["Site do Asaas", "Suporte"]);
  });

  it("abre o link escolhido; cancelar nao abre nada", async () => {
    mockEscolher.mockResolvedValueOnce("asaas");
    await explicarPrecoDoServico();
    expect(mockAbrir).toHaveBeenLastCalledWith(ASAAS_TAXAS_URL);

    mockEscolher.mockResolvedValueOnce("suporte");
    await explicarPrecoDoServico();
    expect(mockAbrir).toHaveBeenLastCalledWith("https://suporte/profissional");

    mockAbrir.mockClear();
    mockEscolher.mockResolvedValueOnce(null);
    await explicarPrecoDoServico();
    expect(mockAbrir).not.toHaveBeenCalled();
  });
});
