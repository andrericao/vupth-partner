import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EstablishmentWithProfessionals } from "@lib/types";
import { lerUltimaFila, limparUltimaFila, salvarUltimaFila } from "../ultimaFila";

const dado = { id: "e1" } as unknown as EstablishmentWithProfessionals;

describe("ultimaFila", () => {
  beforeEach(() => AsyncStorage.clear());

  it("grava e le o ultimo dado do mesmo estabelecimento", async () => {
    await salvarUltimaFila("e1", dado);
    expect(await lerUltimaFila("e1")).toEqual(dado);
  });

  it("nao devolve o dado de outro estabelecimento", async () => {
    await salvarUltimaFila("e1", dado);
    expect(await lerUltimaFila("e2")).toBeNull();
  });

  it("sem nada guardado devolve null", async () => {
    expect(await lerUltimaFila("e1")).toBeNull();
  });

  it("saida da conta apaga tudo", async () => {
    await salvarUltimaFila("e1", dado);
    await limparUltimaFila();
    expect(await lerUltimaFila("e1")).toBeNull();
  });

  it("JSON corrompido vira null, sem lancar", async () => {
    await AsyncStorage.setItem("vupth_ultima_fila", "{ruim");
    expect(await lerUltimaFila("e1")).toBeNull();
  });

  it("falha do armazenamento nao quebra gravar, ler nem limpar", async () => {
    jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("x"));
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("x"));
    jest.spyOn(AsyncStorage, "removeItem").mockRejectedValueOnce(new Error("x"));
    await expect(salvarUltimaFila("e1", dado)).resolves.toBeUndefined();
    await expect(lerUltimaFila("e1")).resolves.toBeNull();
    await expect(limparUltimaFila()).resolves.toBeUndefined();
  });
});
