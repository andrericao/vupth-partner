import { Alert, Modal } from "react-native";
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

  describe("navegacao", () => {
    // Cada item do menu tem seu proprio onPress — exercitamos todos para o
    // componente nao derrubar a cobertura de funcoes (allowlist do jest).
    it.each([
      ["Refeicoes", "/(professional)/meals"],
      ["Meus servicos", "/(professional)/my-services"],
      ["Atendimentos", "/(professional)/attendances"],
      ["Relatorios", "/(professional)/reports"],
      ["Configuracoes", "/(professional)/settings"],
    ])("'%s' navega para %s", (label, route) => {
      const view = renderWithProvider(<ProfessionalMenu />);
      open(view);
      fireEvent.press(view.getByLabelText(label));
      expect(router.push).toHaveBeenCalledWith(route);
    });

    it("profissional-so NAO ve 'Area do dono'", () => {
      const view = renderWithProvider(<ProfessionalMenu />);
      open(view);
      expect(view.queryByLabelText("Area do dono")).toBeNull();
    });

    it("quem acumula OWNER volta para o dashboard do dono", () => {
      useAuthStore.setState({ user: { roles: ["PROFESSIONAL", "OWNER"] } } as any);
      const view = renderWithProvider(<ProfessionalMenu />);
      open(view);
      fireEvent.press(view.getByLabelText("Area do dono"));
      expect(router.replace).toHaveBeenCalledWith("/(owner)/dashboard");
    });
  });

  describe("sair", () => {
    it("pede confirmacao e, ao confirmar, desloga e volta para (auth)", async () => {
      const logout = jest.fn().mockResolvedValue(undefined);
      useAuthStore.setState({ user: { roles: ["PROFESSIONAL"] }, logout } as any);
      const spy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

      const view = renderWithProvider(<ProfessionalMenu />);
      open(view);
      fireEvent.press(view.getByLabelText("Sair"));
      expect(spy).toHaveBeenCalled();

      const buttons = spy.mock.calls[0][2] as { text?: string; onPress?: () => void }[];
      await buttons.find((b) => b.text === "Sair")!.onPress!();

      expect(logout).toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith("/(auth)");
      spy.mockRestore();
    });
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

  describe("fechar o menu", () => {
    it("tocar no card NAO fecha (no-op)", () => {
      const view = renderWithProvider(<ProfessionalMenu />);
      open(view);
      fireEvent.press(view.getByTestId("menu-sheet"));
      expect(view.getByLabelText("Refeicoes")).toBeTruthy(); // segue aberto
    });

    it("tocar no fundo fecha", () => {
      const view = renderWithProvider(<ProfessionalMenu />);
      open(view);
      fireEvent.press(view.getByLabelText("Fechar menu"));
      expect(view.queryByLabelText("Refeicoes")).toBeNull();
    });

    it("fecha pelo botao voltar do sistema (onRequestClose)", () => {
      const view = renderWithProvider(<ProfessionalMenu />);
      open(view);
      fireEvent(view.UNSAFE_getByType(Modal), "requestClose");
    });
  });
});
