import { ScrollView, View } from "react-native";
import { act, render, fireEvent, screen, within } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ChevronRight, Store, User } from "lucide-react-native";
import { router } from "expo-router";

import RoleChoiceScreen from "../../app/(auth)/index";
import { useAuthStore } from "@store/auth.store";
import { useTemaStore } from "@store/tema.store";
import { coresDoTema } from "@theme/tema";
import { TEMAS, contrasteDasClasses, razao, tokenDaClasse } from "../test-utils/contraste";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("@components/CommitDoCodigo", () => ({ CommitDoCodigo: () => null }));
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));
// O escuro so vale com a liberacao aberta (src/theme/liberacao.ts); o tema padrao
// segue claro, entao os testes que nao escolhem tema nao notam.
jest.mock("@theme/liberacao", () => ({ ESCURO_LIBERADO: true }));

// tela-de-entrada (design-entrada, 17/10): "a tela de entrada nao tem dois
// botoes — tem um link". Os cartoes de papel ficam; "Entrar" vira pilula
// secundaria, no rodape fixo, FORA da rolagem. Rodape dentro da rolagem ja
// custou duas correcoes (DS1 e entrar-atras-da-barra).
const metricas = (bottom: number) => ({
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom },
});

function abrir(bottom = 34) {
  return render(
    <SafeAreaProvider initialMetrics={metricas(bottom)}>
      <RoleChoiceScreen />
    </SafeAreaProvider>
  );
}

describe("tela de entrada do Partner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ isAuthenticated: false });
  });

  it("os cartoes de papel ficam, e o dono e 'Sou dono de loja'", () => {
    abrir();
    expect(screen.getByText("Como você vai usar o Vupth?")).toBeTruthy();
    expect(screen.getByText("Sou dono de loja")).toBeTruthy();
    expect(screen.queryByText(/estabelecimento/i)).toBeNull();
    expect(screen.getByText("Sou profissional")).toBeTruthy();
    fireEvent.press(screen.getByTestId("role-owner"));
    expect(router.push).toHaveBeenCalledWith("/(auth)/register?role=owner");
  });

  it("Entrar e uma pilula secundaria da mesma altura do botao pilula, e leva ao login", () => {
    abrir();
    const botao = screen.getByTestId("go-login");
    expect(within(botao).getByText("Entrar")).toBeTruthy();
    const classes: string = botao.props.className;
    expect(classes).toContain("min-h-[54px]");
    expect(classes).toContain("rounded-full");
    expect(classes).toContain("bg-vupth-surface");
    fireEvent.press(botao);
    expect(router.push).toHaveBeenCalledWith("/(auth)/login");
  });

  it("o rodape (Entrar e os links legais) fica FORA da rolagem", () => {
    abrir();
    const rolagem = within(screen.UNSAFE_getByType(ScrollView));
    expect(rolagem.queryByTestId("go-login")).toBeNull();
    expect(rolagem.queryByTestId("links-legais")).toBeNull();
    const rodape = within(screen.getByTestId("entrada-rodape"));
    expect(rodape.getByTestId("go-login")).toBeTruthy();
    expect(rodape.getByTestId("links-legais")).toBeTruthy();
    // os cartoes, sim, rolam
    expect(rolagem.getByTestId("role-owner")).toBeTruthy();
  });

  it("o espaco de baixo vem do inset real do aparelho, nao de um valor fixo", () => {
    const { unmount } = abrir(34);
    expect(screen.getByTestId("entrada-rodape").props.style.paddingBottom).toBe(34 + 16);
    unmount();
    abrir(0);
    expect(screen.getByTestId("entrada-rodape").props.style.paddingBottom).toBe(16);
  });

  it("quem ja esta logado continua vendo 'O que voce quer criar?' e o Entrar some", () => {
    useAuthStore.setState({ isAuthenticated: true });
    abrir();
    expect(screen.getByText("O que você quer criar?")).toBeTruthy();
    expect(screen.queryByTestId("go-login")).toBeNull();
    expect(screen.queryByText("Entrar")).toBeNull();
    // os termos ficam para todos
    expect(within(screen.getByTestId("entrada-rodape")).getByTestId("links-legais")).toBeTruthy();
    fireEvent.press(screen.getByTestId("role-owner"));
    expect(router.push).toHaveBeenCalledWith("/(owner)/onboarding/establishment");
  });
});

// DEC-75: o fundo era bg-white, o texto forest e os icones #163300. Le a cor que
// a tela RESOLVE em cada tema e mede o contraste.
describe.each(TEMAS)("tela de entrada no tema %s", (tema) => {
  const cores = coresDoTema(tema);
  const usar = (t: "claro" | "escuro") =>
    act(() => {
      useTemaStore.setState({ preferencia: t, restaurado: true });
    });

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ isAuthenticated: false });
    usar(tema);
  });
  afterEach(() => usar("claro"));

  const fundo = () => {
    const achado = screen.UNSAFE_getAllByType(View).find((v) => (v.props.className ?? "").split(" ").includes("bg-vupth-background"));
    if (!achado) throw new Error("a tela nao pinta o background do tema");
    return achado;
  };

  it("o fundo e o background do tema e os titulos passam em 4,5:1 sobre ele", () => {
    abrir();
    const tela = fundo();
    for (const texto of ["VUPTH", "Como você vai usar o Vupth?", "Escolha seu papel para começar."]) {
      expect(contrasteDasClasses(screen.getByText(texto), tela, tema)).toBeGreaterThanOrEqual(4.5);
    }
    expect(tokenDaClasse(screen.getByText("VUPTH"), "text")).toBe("textPrimary");
  });

  it("o cartao de destaque e green: titulo, descricao e icones sao o par dele (onGreen)", () => {
    abrir();
    const cartao = screen.getByTestId("role-owner");
    expect(tokenDaClasse(cartao, "bg")).toBe("green");
    const titulo = within(cartao).getByText("Sou dono de loja");
    const descricao = within(cartao).getByText("Gerencie sua loja, profissionais e filas");
    expect(tokenDaClasse(titulo, "text")).toBe("onGreen");
    expect(tokenDaClasse(descricao, "text")).toBe("onGreen");
    expect(contrasteDasClasses(titulo, cartao, tema)).toBeGreaterThanOrEqual(4.5);
    // A descricao leva opacity-70 (so ela). O par onGreen/green e o mesmo hex nos
    // dois temas, entao o escuro NAO piora o que o claro ja tem (a 70% sao 4,38:1,
    // um defeito do claro que esta conversao nao toca).
    expect(descricao.props.className).toContain("opacity-70");
    expect([cores.onGreen, cores.green]).toEqual([coresDoTema("claro").onGreen, coresDoTema("claro").green]);
    // icones do cartao
    const icone = within(cartao).UNSAFE_getByType(Store);
    const seta = within(cartao).UNSAFE_getByType(ChevronRight);
    for (const no of [icone, seta]) {
      expect(no.props.color).toBe(cores.onGreen);
      expect(razao(no.props.color, cores.green)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("o outro cartao e surface: titulo, descricao e icones leem o tema", () => {
    abrir();
    const cartao = screen.getByTestId("role-professional");
    expect(tokenDaClasse(cartao, "bg")).toBe("surface");
    const titulo = within(cartao).getByText("Sou profissional");
    const descricao = within(cartao).getByText("Atenda clientes e organize sua fila");
    expect(tokenDaClasse(titulo, "text")).toBe("textPrimary");
    expect(contrasteDasClasses(titulo, cartao, tema)).toBeGreaterThanOrEqual(4.5);
    expect(contrasteDasClasses(descricao, cartao, tema)).toBeGreaterThanOrEqual(4.5);
    for (const no of [within(cartao).UNSAFE_getByType(User), within(cartao).UNSAFE_getByType(ChevronRight)]) {
      expect(no.props.color).toBe(cores.textPrimary);
      expect(razao(no.props.color, cores.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
