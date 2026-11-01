import { simularNativoDoAsyncStorage } from "../../test-utils/nativoDoAsyncStorage";
import { carregarArmazem, gravarItem, lerItem, nativoPresente, removerItem } from "../armazenamentoOpcional";

describe("armazenamentoOpcional", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
    jest.dontMock("@react-native-async-storage/async-storage");
  });

  it("sem o modulo nativo: nao carrega o pacote e tudo devolve null/false", async () => {
    simularNativoDoAsyncStorage(false);
    let carregou = 0;
    jest.doMock("@react-native-async-storage/async-storage", () => {
      carregou += 1;
      throw new Error("[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null.");
    });
    expect(nativoPresente()).toBe(false);
    expect(carregarArmazem()).toBeNull();
    expect(await lerItem("k")).toBeNull();
    expect(await gravarItem("k", "v")).toBe(false);
    expect(await removerItem("k")).toBe(false);
    expect(carregou).toBe(0); // o pacote nem foi tocado
  });

  it("modulo nativo presente mas o pacote lanca ao carregar: nada quebra", async () => {
    simularNativoDoAsyncStorage(true);
    jest.doMock("@react-native-async-storage/async-storage", () => {
      throw new Error("[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null.");
    });
    expect(carregarArmazem()).toBeNull();
    expect(await lerItem("k")).toBeNull();
    expect(await gravarItem("k", "v")).toBe(false);
  });

  it("getItem, setItem e removeItem que lancam de forma sincrona viram null/false", async () => {
    simularNativoDoAsyncStorage(true);
    const quebra = () => {
      throw new Error("lancou sincrono");
    };
    jest.doMock("@react-native-async-storage/async-storage", () => ({
      __esModule: true,
      default: { getItem: quebra, setItem: quebra, removeItem: quebra },
    }));
    expect(await lerItem("k")).toBeNull();
    expect(await gravarItem("k", "v")).toBe(false);
    expect(await removerItem("k")).toBe(false);
  });

  it("presente e saudavel: grava, le e remove", async () => {
    simularNativoDoAsyncStorage(true);
    expect(await gravarItem("k", "v")).toBe(true);
    expect(await lerItem("k")).toBe("v");
    expect(await removerItem("k")).toBe(true);
    expect(await lerItem("k")).toBeNull();
  });
});
