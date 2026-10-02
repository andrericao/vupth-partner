import * as SecureStore from "expo-secure-store";
import { useFonteStore, fs } from "@store/fonte.store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(async () => undefined),
}));
const store = SecureStore as jest.Mocked<typeof SecureStore>;

describe("fonte.store", () => {
  beforeEach(() => useFonteStore.setState({ passo: 0 }));

  it("escolher guarda no aparelho e o fs soma o passo", async () => {
    await useFonteStore.getState().escolher(3);
    expect(store.setItemAsync).toHaveBeenCalledWith("vupth_passo_da_fonte", "3");
    expect(fs(12)).toBe(15);
  });

  it("restaurar le do aparelho; valor estranho volta a Normal", async () => {
    store.getItemAsync.mockResolvedValueOnce("2");
    await useFonteStore.getState().restaurar();
    expect(useFonteStore.getState().passo).toBe(2);
    store.getItemAsync.mockResolvedValueOnce("99");
    await useFonteStore.getState().restaurar();
    expect(useFonteStore.getState().passo).toBe(0);
  });

  it("falha do armazenamento nao quebra", async () => {
    store.getItemAsync.mockRejectedValueOnce(new Error("x"));
    await expect(useFonteStore.getState().restaurar()).resolves.toBeUndefined();
    store.setItemAsync.mockRejectedValueOnce(new Error("x"));
    await expect(useFonteStore.getState().escolher(1)).resolves.toBeUndefined();
    expect(useFonteStore.getState().passo).toBe(1);
  });
});
