import { api } from "@lib/api";
import {
  buscarMinimoDoServico,
  abaixoDoMinimo,
  textoDoAvisoDeMinimo,
  confirmarValorMinimo,
} from "@lib/valorMinimo";

jest.mock("@lib/api", () => ({ api: { get: jest.fn() } }));

// aviso-valor-minimo (DEC-121; Backend 37c7d91).
describe("valorMinimo", () => {
  afterEach(() => jest.clearAllMocks());

  it("le o minimo em GET /settings/service-min-price", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { min_price: 5 } });
    await expect(buscarMinimoDoServico()).resolves.toBe(5);
    expect(api.get).toHaveBeenCalledWith("/settings/service-min-price");
    (api.get as jest.Mock).mockResolvedValue({ data: { min_price: "7.5" } });
    await expect(buscarMinimoDoServico()).resolves.toBe(7.5);
  });

  it("sem resposta util, sem minimo", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: {} });
    await expect(buscarMinimoDoServico()).resolves.toBeNull();
    (api.get as jest.Mock).mockResolvedValue({ data: { min_price: -1 } });
    await expect(buscarMinimoDoServico()).resolves.toBeNull();
    (api.get as jest.Mock).mockRejectedValue(new Error("500"));
    await expect(buscarMinimoDoServico()).resolves.toBeNull();
  });

  it("igual ou abaixo do minimo avisa; acima nao; minimo 0 ou ausente nunca", () => {
    expect(abaixoDoMinimo(5, 5)).toBe(true);
    expect(abaixoDoMinimo(3, 5)).toBe(true);
    expect(abaixoDoMinimo(5.01, 5)).toBe(false);
    expect(abaixoDoMinimo(1, 0)).toBe(false);
    expect(abaixoDoMinimo(1, null)).toBe(false);
  });

  it("o texto cabe no guia: corpo ate 70 caracteres, botoes de uma palavra", () => {
    const t = textoDoAvisoDeMinimo(5);
    expect(t.mensagem).toBe("O mínimo é R$ 5,00. As taxas deixam o preço do cliente alto.");
    expect(t.mensagem.length).toBeLessThanOrEqual(70);
    expect(t.confirmar.split(" ")).toHaveLength(1);
    expect(t.cancelar).toBe("Cancelar");
  });

  it("preco ok ou sem minimo: salva sem perguntar; abaixo: pergunta e respeita a resposta", async () => {
    const perguntar = jest.fn().mockResolvedValue(false);
    await expect(confirmarValorMinimo(30, { buscar: async () => 5, perguntar })).resolves.toBe(true);
    await expect(confirmarValorMinimo(3, { buscar: async () => null, perguntar })).resolves.toBe(true);
    expect(perguntar).not.toHaveBeenCalled();
    await expect(confirmarValorMinimo(3, { buscar: async () => 5, perguntar })).resolves.toBe(false);
    expect(perguntar).toHaveBeenCalledWith(expect.objectContaining({ titulo: "Valor baixo", confirmar: "Cadastrar" }));
    perguntar.mockResolvedValue(true);
    await expect(confirmarValorMinimo(5, { buscar: async () => 5, perguntar })).resolves.toBe(true);
  });
});
