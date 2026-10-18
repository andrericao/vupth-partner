import * as SecureStore from "expo-secure-store";
import { useTemaStore, LIMITE_DA_LEITURA_MS } from "@store/tema.store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(async () => undefined),
}));
const store = SecureStore as jest.Mocked<typeof SecureStore>;

describe("tema.store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTemaStore.setState({ preferencia: "claro", restaurado: false });
  });

  it("o PADRAO e claro e nada foi lido ainda", () => {
    expect(useTemaStore.getState().preferencia).toBe("claro");
    expect(useTemaStore.getState().restaurado).toBe(false);
  });

  it("escolher guarda no aparelho", async () => {
    await useTemaStore.getState().escolher("escuro");
    expect(store.setItemAsync).toHaveBeenCalledWith("vupth_tema", "escuro");
    expect(useTemaStore.getState().preferencia).toBe("escuro");
  });

  it("escolher valor estranho cai no claro, nunca no escuro", async () => {
    await useTemaStore.getState().escolher("noturno" as never);
    expect(store.setItemAsync).toHaveBeenCalledWith("vupth_tema", "claro");
    expect(useTemaStore.getState().preferencia).toBe("claro");
  });

  it("restaurar le do aparelho e marca como restaurado", async () => {
    store.getItemAsync.mockResolvedValueOnce("automatico");
    await useTemaStore.getState().restaurar();
    expect(store.getItemAsync).toHaveBeenCalledWith("vupth_tema");
    expect(useTemaStore.getState()).toMatchObject({ preferencia: "automatico", restaurado: true });
  });

  it.each([null, "", "dark", "ESCURO", "1"])("restaurar com %p guardado volta ao claro", async (guardado) => {
    useTemaStore.setState({ preferencia: "escuro" });
    store.getItemAsync.mockResolvedValueOnce(guardado);
    await useTemaStore.getState().restaurar();
    expect(useTemaStore.getState()).toMatchObject({ preferencia: "claro", restaurado: true });
  });

  it("falha do armazenamento nao quebra e o app ainda abre (restaurado)", async () => {
    store.getItemAsync.mockRejectedValueOnce(new Error("x"));
    await expect(useTemaStore.getState().restaurar()).resolves.toBeUndefined();
    expect(useTemaStore.getState()).toMatchObject({ preferencia: "claro", restaurado: true });
    store.setItemAsync.mockRejectedValueOnce(new Error("x"));
    await expect(useTemaStore.getState().escolher("escuro")).resolves.toBeUndefined();
    expect(useTemaStore.getState().preferencia).toBe("escuro");
  });

  it("cofre que nao responde nao prende o app: passado o limite abre no claro", async () => {
    // O layout raiz segura a primeira tela ate `restaurado`. Sem limite, um
    // cofre mudo seria o spinner eterno de 27/08.
    jest.useFakeTimers();
    try {
      store.getItemAsync.mockReturnValueOnce(new Promise(() => {}));
      const leitura = useTemaStore.getState().restaurar();
      expect(useTemaStore.getState().restaurado).toBe(false);
      await jest.advanceTimersByTimeAsync(LIMITE_DA_LEITURA_MS);
      await leitura;
      expect(useTemaStore.getState()).toMatchObject({ preferencia: "claro", restaurado: true });
    } finally {
      jest.useRealTimers();
    }
  });
});
