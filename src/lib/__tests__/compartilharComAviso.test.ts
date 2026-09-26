import { compartilharComAviso } from "@lib/compartilharComAviso";

const mockAvisar = jest.fn(async () => undefined);
jest.mock("@lib/confirmar", () => ({ avisar: (...a: unknown[]) => mockAvisar(...(a as [])) }));

const mockCompartilhar = jest.fn();
jest.mock("@lib/linkPublico", () => ({
  compartilharLink: (...a: unknown[]) => mockCompartilhar(...a),
}));

const texto = { titulo: "Loja", mensagem: "Entre na fila:" };

describe("compartilharComAviso", () => {
  beforeEach(() => {
    mockAvisar.mockClear();
    mockCompartilhar.mockReset();
  });

  it("compartilhou pelo sistema: nenhum aviso a mais", async () => {
    mockCompartilhar.mockResolvedValue("compartilhado");
    await compartilharComAviso("https://x/loja/1", texto);
    expect(mockAvisar).not.toHaveBeenCalled();
  });

  it("copiou (web): avisa que o link foi copiado", async () => {
    mockCompartilhar.mockResolvedValue("copiado");
    await compartilharComAviso("https://x/loja/1", texto);
    expect(mockAvisar).toHaveBeenCalledWith(expect.objectContaining({ titulo: "Link copiado" }));
  });

  it("falhou: mostra o link para copiar a mao", async () => {
    mockCompartilhar.mockResolvedValue("falhou");
    await compartilharComAviso("https://x/loja/1", texto);
    expect(mockAvisar).toHaveBeenCalledWith(
      expect.objectContaining({ mensagem: expect.stringContaining("https://x/loja/1") })
    );
  });
});
