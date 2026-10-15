import { Linking } from "react-native";
import { SUPORTE_URL, linkDoSuporte, abrirSuporte } from "@lib/suporte";

// botao-suporte (Andre, 11/10 e 15/10): o botao Suporte das Configuracoes abre
// o site de suporte no navegador.
describe("suporte", () => {
  afterEach(() => jest.restoreAllMocks());

  it("o site de suporte e o do Cloudflare", () => {
    expect(SUPORTE_URL).toBe("https://vupth-support.pages.dev/");
  });

  it("profissional e dono vao ao site de suporte", () => {
    expect(linkDoSuporte("profissional")).toBe(SUPORTE_URL);
    expect(linkDoSuporte("dono")).toBe(SUPORTE_URL);
  });

  it("abre o link no navegador", async () => {
    const abrir = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await abrirSuporte("dono");
    expect(abrir).toHaveBeenCalledWith(SUPORTE_URL);
  });

  it("sem navegador, nao lanca", async () => {
    jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("sem app"));
    await expect(abrirSuporte("profissional")).resolves.toBeUndefined();
  });
});
