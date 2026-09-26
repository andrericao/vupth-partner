import { copiarComAviso } from "@lib/copiar";

// Botao "copiar" (build 1.4.0, expo-clipboard): o link da loja/profissional ao
// lado do compartilhar, e o token do cartao Push dos 7 toques.
const mockSet = jest.fn(async (_t: string) => true);
jest.mock("expo-clipboard", () => ({ setStringAsync: (t: string) => mockSet(t) }));
const mockAvisar = jest.fn(async () => undefined);
jest.mock("@lib/confirmar", () => ({ avisar: (...a: unknown[]) => mockAvisar(...(a as [])) }));

describe("copiarComAviso", () => {
  beforeEach(() => {
    mockSet.mockClear();
    mockAvisar.mockClear();
  });

  it("copia e avisa o que foi copiado", async () => {
    await copiarComAviso("https://x/loja/1", "Link da loja");
    expect(mockSet).toHaveBeenCalledWith("https://x/loja/1");
    expect(mockAvisar).toHaveBeenCalledWith(expect.objectContaining({ titulo: "Link da loja copiado" }));
  });

  it("falhou ao copiar: mostra o texto para copiar a mao", async () => {
    mockSet.mockRejectedValueOnce(new Error("x"));
    await copiarComAviso("abc", "Token");
    expect(mockAvisar).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: "Não deu para copiar", mensagem: expect.stringContaining("abc") })
    );
  });
});
