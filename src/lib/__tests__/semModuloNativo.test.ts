import { copiarComAviso } from "@lib/copiar";
import { pegarLocalizacao } from "@lib/localizacao";
import { escolherFoto } from "@lib/fotoDePerfil";

// Binario sem as libs nativas do 1.4.0 (Andre, 27/09): a funcao avisa, a tela
// nao cai.
jest.mock("@lib/modulosNativos", () => ({
  carregarClipboard: () => null,
  carregarLocation: () => null,
  carregarImagePicker: () => null,
  carregarImageManipulator: () => null,
  SEM_MODULO: "Esta função precisa da versão nova do app. Atualize o app para usá-la.",
}));
const mockAvisar = jest.fn(async () => undefined);
jest.mock("@lib/confirmar", () => ({ avisar: (...a: unknown[]) => mockAvisar(...(a as [])) }));
jest.mock("@lib/api", () => ({ api: {}, getApiErrorMessage: (_e: unknown, f: string) => f }));


describe("sem o modulo nativo no aparelho", () => {
  it("copiar mostra o texto para copiar a mao", async () => {
    await copiarComAviso("abc", "Token");
    expect(mockAvisar).toHaveBeenCalledWith(expect.objectContaining({ titulo: "Não deu para copiar" }));
  });

  it("localizacao diz que precisa da versao nova", async () => {
    await expect(pegarLocalizacao()).rejects.toThrow(/versão nova do app/);
  });

  it("foto diz que precisa da versao nova", async () => {
    await expect(escolherFoto()).rejects.toThrow(/versão nova do app/);
  });

  it("sem o redutor, a foto escolhida sobe original", async () => {
    const picker = {
      requestMediaLibraryPermissionsAsync: async () => ({ granted: true }),
      launchImageLibraryAsync: async () => ({ canceled: false, assets: [{ uri: "file:///o.jpg" }] }),
    };
    await expect(escolherFoto({ picker: picker as any })).resolves.toEqual({ uri: "file:///o.jpg" });
  });
});
