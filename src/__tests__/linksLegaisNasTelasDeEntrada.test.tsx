import type React from "react";
import { render, screen, within } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import LoginScreen from "../../app/(auth)/login";
import RegisterScreen from "../../app/(auth)/register";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ role: "owner" }),
}));
jest.mock("@components/CommitDoCodigo", () => ({ CommitDoCodigo: () => null }));
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));

// termos-e-politica-nas-telas-de-entrada (Andre, 28/10): no cadastro e no login, os dois
// links ficam num bloco de informacoes separado do formulario e dos botoes.
const metricas = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function abrir(Tela: () => React.ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={metricas}>
      <Tela />
    </SafeAreaProvider>
  );
}

describe.each([
  ["login", LoginScreen, "login-submit"],
  ["cadastro", RegisterScreen, "register-submit"],
])("links legais na tela de %s", (_nome, Tela, botao) => {
  it("os dois links ficam num bloco proprio, fora do formulario e dos botoes", () => {
    abrir(Tela as () => React.ReactElement);
    const bloco = screen.getByTestId("bloco-legal");
    expect(within(bloco).getByText("Termos de uso")).toBeTruthy();
    expect(within(bloco).getByText("Política de privacidade")).toBeTruthy();
    expect(bloco.props.className).toContain("border-t");
    expect(within(bloco).queryByTestId(botao)).toBeNull();
    expect(within(bloco).queryByTestId("go-login")).toBeNull();
    expect(within(bloco).queryByTestId("go-register")).toBeNull();
  });
});
