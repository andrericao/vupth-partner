import { fireEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { ProfessionalMenu } from "../ProfessionalMenu";
import { useAuthStore } from "@store/auth.store";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

const open = (view: ReturnType<typeof renderWithProvider>) =>
  fireEvent.press(view.getByLabelText("Menu"));

describe("ProfessionalMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: { roles: ["PROFESSIONAL"] } } as any);
  });

  it("abre o menu e navega para Refeicoes", () => {
    const view = renderWithProvider(<ProfessionalMenu />);
    open(view);
    fireEvent.press(view.getByLabelText("Refeicoes"));
    expect(router.push).toHaveBeenCalledWith("/(professional)/meals");
  });

  it("navega para Configuracoes", () => {
    const view = renderWithProvider(<ProfessionalMenu />);
    open(view);
    fireEvent.press(view.getByLabelText("Configuracoes"));
    expect(router.push).toHaveBeenCalledWith("/(professional)/settings");
  });

  it("profissional-so NAO ve 'Area do dono'", () => {
    const view = renderWithProvider(<ProfessionalMenu />);
    open(view);
    expect(view.queryByLabelText("Area do dono")).toBeNull();
  });

  it("quem acumula OWNER ve 'Area do dono' e volta para o dashboard", () => {
    useAuthStore.setState({ user: { roles: ["PROFESSIONAL", "OWNER"] } } as any);
    const view = renderWithProvider(<ProfessionalMenu />);
    open(view);
    fireEvent.press(view.getByLabelText("Area do dono"));
    expect(router.replace).toHaveBeenCalledWith("/(owner)/dashboard");
  });

  describe("dot", () => {
    it("sem sinal nenhum, o ☰ fica limpo", () => {
      const view = renderWithProvider(<ProfessionalMenu />);
      expect(view.queryByTestId("menu-dot")).toBeNull();
    });

    it("refeicao perto: dot no ☰ e no item Refeicoes", () => {
      const view = renderWithProvider(<ProfessionalMenu mealDot />);
      expect(view.getByTestId("menu-dot")).toBeTruthy();
      open(view);
      expect(view.getByTestId("menu-dot-meals")).toBeTruthy();
      expect(view.getByText(/esta na hora/)).toBeTruthy();
    });

    it("pendencia de cadastro: dot no ☰ e no item Configuracoes", () => {
      const view = renderWithProvider(<ProfessionalMenu settingsDot />);
      expect(view.getByTestId("menu-dot")).toBeTruthy();
      open(view);
      expect(view.getByTestId("menu-dot-settings")).toBeTruthy();
    });
  });

  describe("abrir/fechar estabelecimento", () => {
    it("sem afiliacao, a opcao nao aparece", () => {
      const view = renderWithProvider(<ProfessionalMenu />);
      open(view);
      expect(view.queryByLabelText("Abrir estabelecimento")).toBeNull();
      expect(view.queryByLabelText("Fechar estabelecimento")).toBeNull();
    });

    it("loja fechada: oferece ABRIR e dispara o toggle", () => {
      const onToggle = jest.fn();
      const view = renderWithProvider(
        <ProfessionalMenu establishment={{ isOpen: false, onToggle }} />
      );
      open(view);
      expect(view.getByText(/FECHADA agora/)).toBeTruthy();
      fireEvent.press(view.getByLabelText("Abrir estabelecimento"));
      expect(onToggle).toHaveBeenCalled();
    });

    it("loja aberta: oferece FECHAR e dispara o toggle", () => {
      const onToggle = jest.fn();
      const view = renderWithProvider(
        <ProfessionalMenu establishment={{ isOpen: true, onToggle }} />
      );
      open(view);
      expect(view.getByText(/ABERTA agora/)).toBeTruthy();
      fireEvent.press(view.getByLabelText("Fechar estabelecimento"));
      expect(onToggle).toHaveBeenCalled();
    });
  });
});
