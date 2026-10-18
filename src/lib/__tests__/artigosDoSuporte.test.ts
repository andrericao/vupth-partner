import { Linking } from "react-native";

import { ARTIGOS_DO_SUPORTE, abrirArtigo, linkDoArtigo, type Artigo } from "@lib/artigosDoSuporte";
import { SUPORTE_URL } from "@lib/suporte";

// "Saiba mais" abre o ARTIGO do assunto (GUIA_DE_TEXTO.md regra 4 e §5), nunca a
// home do Suporte.
describe("artigos do Suporte", () => {
  const artigos = Object.keys(ARTIGOS_DO_SUPORTE) as Artigo[];

  it.each(artigos)("%s tem a URL estável do artigo, no perfil do parceiro", (artigo) => {
    const link = linkDoArtigo(artigo);
    expect(link.startsWith(`${SUPORTE_URL}artigos/parceiro/`)).toBe(true);
    expect(link.endsWith(".html")).toBe(true);
    expect(link).not.toBe(SUPORTE_URL);
  });

  it("não há dois assuntos no mesmo artigo por engano", () => {
    expect(new Set(Object.values(ARTIGOS_DO_SUPORTE)).size).toBe(artigos.length);
  });

  it("abre o link no navegador do sistema", async () => {
    const abrir = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await abrirArtigo("atraso");
    expect(abrir).toHaveBeenCalledWith(`${SUPORTE_URL}artigos/parceiro/atrasos.html`);
    abrir.mockRestore();
  });

  it("sem navegador, não derruba a tela", async () => {
    const abrir = jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("sem navegador"));
    await expect(abrirArtigo("conta")).resolves.toBeUndefined();
    abrir.mockRestore();
  });
});
