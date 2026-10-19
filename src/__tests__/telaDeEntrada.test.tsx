import { ScrollView } from "react-native";
import { render, fireEvent, screen, within } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { router } from "expo-router";

import RoleChoiceScreen from "../../app/(auth)/index";
import { useAuthStore } from "@store/auth.store";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("@components/CommitDoCodigo", () => ({ CommitDoCodigo: () => null }));

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
