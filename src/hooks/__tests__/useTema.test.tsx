import { renderHook, act } from "@testing-library/react-native";
import { useTema } from "@hooks/useTema";
import { useTemaStore } from "@store/tema.store";
import { coresDoTema, varsDoTema } from "@theme/tema";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));

// O aparelho: o teste escolhe se ele esta no claro ou no escuro.
let mockSistema: "light" | "dark" | null = "light";
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: () => mockSistema,
}));

// A liberacao do escuro (src/theme/liberacao.ts) lida a cada uso.
let mockLiberado = true;
jest.mock("@theme/liberacao", () => ({
  get ESCURO_LIBERADO() {
    return mockLiberado;
  },
}));

// Le o tema e desmonta: cada leitura e independente (sem hook vivo reagindo ao
// setState do proximo passo do teste).
function ler() {
  const { result, unmount } = renderHook(() => useTema());
  const valor = result.current;
  unmount();
  return valor;
}

describe("useTema", () => {
  beforeEach(() => {
    mockSistema = "light";
    mockLiberado = true;
    useTemaStore.setState({ preferencia: "claro", restaurado: true });
  });

  it("no CLARO (o padrao) entrega os hex de hoje, o veu claro e as variaveis do claro", () => {
    const tema = ler();
    expect(tema).toMatchObject({ tema: "claro", escuro: false, preferencia: "claro" });
    expect(tema.cores).toBe(coresDoTema("claro"));
    expect(tema.cores.surface).toBe("#F3F5F1");
    expect(tema.cores.textPrimary).toBe("#163300");
    expect(tema.veu).toBe("rgba(22,51,0,.35)");
    expect(tema.vars).toEqual(varsDoTema("claro"));
  });

  it("no ESCURO a mesma classe resolve para o par escuro: surface vira o forest, texto fica claro", () => {
    useTemaStore.setState({ preferencia: "escuro" });
    const tema = ler();
    expect(tema).toMatchObject({ tema: "escuro", escuro: true, preferencia: "escuro" });
    expect(tema.cores.background).toBe("#0B1A04");
    expect(tema.cores.surface).toBe("#163300");
    expect(tema.cores.textPrimary).toBe("#F3F5F1");
    expect(tema.cores.painel).toBe("#163300");
    expect(tema.veu).toBe("rgba(0,0,0,.55)");
    // o que o layout raiz passa para vars(): as classes bg-vupth-* leem isto
    expect(tema.vars["--vupth-surface"]).toBe("22 51 0");
    expect(tema.vars["--vupth-background"]).toBe("11 26 4");
    expect(tema.vars["--vupth-text-primary"]).toBe("243 245 241");
  });

  it("o botao primario e igual nos dois temas", () => {
    const claro = ler();
    useTemaStore.setState({ preferencia: "escuro" });
    const escuro = ler();
    expect(escuro.cores.green).toBe(claro.cores.green);
    expect(escuro.cores.onGreen).toBe(claro.cores.onGreen);
  });

  it("automatico segue o aparelho", () => {
    useTemaStore.setState({ preferencia: "automatico" });
    mockSistema = "dark";
    expect(ler().tema).toBe("escuro");
    mockSistema = "light";
    expect(ler().tema).toBe("claro");
    mockSistema = null;
    expect(ler().tema).toBe("claro");
  });

  it("claro e escuro ignoram o aparelho", () => {
    mockSistema = "dark";
    expect(ler().tema).toBe("claro");
    useTemaStore.setState({ preferencia: "escuro" });
    mockSistema = "light";
    expect(ler().tema).toBe("escuro");
  });

  it("redesenha quando a escolha muda e devolve o mesmo objeto enquanto nada muda", () => {
    const { result, rerender } = renderHook(() => useTema());
    const primeiro = result.current;
    rerender({});
    expect(result.current).toBe(primeiro);
    act(() => useTemaStore.setState({ preferencia: "escuro" }));
    expect(result.current.tema).toBe("escuro");
    expect(result.current).not.toBe(primeiro);
  });

  it("com o escuro NAO liberado, o que estiver guardado nao vale (nunca fica preso no escuro)", () => {
    mockLiberado = false;
    useTemaStore.setState({ preferencia: "escuro" });
    expect(ler()).toMatchObject({ tema: "claro", preferencia: "claro" });
    mockSistema = "dark";
    useTemaStore.setState({ preferencia: "automatico" });
    expect(ler().tema).toBe("claro");
  });
});
