import * as SecureStore from "expo-secure-store";
import { pontoJaMarcado, marcarPonto } from "../pontoPeloGps";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

const store = SecureStore as jest.Mocked<typeof SecureStore>;

// ponto-da-loja-pelo-gps (05/10): marcado uma vez, nao pergunta de novo.
describe("pontoPeloGps", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sem marca: nao marcado; com a marca da loja: marcado", async () => {
    store.getItemAsync.mockResolvedValueOnce(null);
    await expect(pontoJaMarcado("e1")).resolves.toBe(false);
    store.getItemAsync.mockResolvedValueOnce("1");
    await expect(pontoJaMarcado("e1")).resolves.toBe(true);
    expect(store.getItemAsync).toHaveBeenLastCalledWith("ponto_gps_e1");
  });

  it("marcar grava por loja; a chave so leva caracteres que o SecureStore aceita", async () => {
    await marcarPonto("e1:/x");
    expect(store.setItemAsync).toHaveBeenCalledWith("ponto_gps_e1x", "1");
  });

  it("storage com erro: nao marcado, e marcar nao quebra", async () => {
    store.getItemAsync.mockRejectedValueOnce(new Error("x"));
    await expect(pontoJaMarcado("e1")).resolves.toBe(false);
    store.setItemAsync.mockRejectedValueOnce(new Error("x"));
    await expect(marcarPonto("e1")).resolves.toBeUndefined();
  });
});
