import * as SecureStore from "expo-secure-store";

import { deveAnunciar, jaAnunciou, marcarAnunciado } from "../anuncioPronto";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

// 🔴 "O anúncio de que o estabelecimento já pode atender deve ser um modal"
// (10/09). Era uma faixa verde que ficava na tela ENQUANTO o perfil não
// estivesse 100% — ou seja, quase sempre. Notícia que não sai de cena vira
// decoração, e a pessoa para de ler o card inteiro.
describe("deveAnunciar", () => {
  it("anuncia quando o básico fecha em 100% e ainda não foi anunciado", () => {
    expect(deveAnunciar(100, false)).toBe(true);
  });

  it("não repete: anunciado uma vez, nunca mais", () => {
    expect(deveAnunciar(100, true)).toBe(false);
  });

  it("não anuncia antes de fechar o básico", () => {
    expect(deveAnunciar(99, false)).toBe(false);
    expect(deveAnunciar(0, false)).toBe(false);
  });

  it("NÃO depende do 'Perfil completo' — o que se anuncia é 'pode atender'", () => {
    // Era essa confusão que fazia a faixa ficar eterna: o básico fechava, o
    // perfil não, e o anúncio continuava na tela.
    expect(deveAnunciar(100, false)).toBe(true);
  });
});

describe("memória do anúncio", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lembra por PERFIL — dono e profissional são anúncios diferentes", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("1");

    await jaAnunciou("dono");
    await jaAnunciou("profissional");

    const chaves = (SecureStore.getItemAsync as jest.Mock).mock.calls.map((c) => c[0]);
    expect(new Set(chaves).size).toBe(2);
  });

  it("nunca anunciado ainda: devolve false", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    expect(await jaAnunciou("dono")).toBe(false);
  });

  it("🔴 sem storage, prefere NÃO repetir — chato é pior que ausente", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error("sem storage"));
    expect(await jaAnunciou("profissional")).toBe(true);
  });

  it("marcar grava a chave do perfil", async () => {
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    await marcarAnunciado("dono");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(expect.stringContaining("dono"), "1");
  });

  it("falhar ao gravar NÃO derruba o fluxo — o anúncio já aconteceu", async () => {
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error("cheio"));
    await expect(marcarAnunciado("dono")).resolves.toBeUndefined();
  });
});
