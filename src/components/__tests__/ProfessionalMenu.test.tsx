import { Alert, Modal } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { ProfessionalMenu } from "../ProfessionalMenu";
import { useAuthStore } from "@store/auth.store";
import { comingSoon } from "@components/comingSoon";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock("@components/comingSoon", () => ({ comingSoon: jest.fn() }));

const open = (view: ReturnType<typeof renderWithProvider>) =>
  fireEvent.press(view.getByLabelText("Opcoes da fila"));

describe("ProfessionalMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: { roles: ["PROFESSIONAL"] } } as any);
  });

  describe("navegacao", () => {
    it.each([
      ["Refeicoes", "/(professional)/meals"],
      ["Adicionar cliente", "/(professional)/add-guest"],
      ["Meu dia", "/(professional)/reports"],
      ["Atendimentos", "/(professional)/attendances"],
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

  describe("status (stub do S1)", () => {
    it("trocar de status cai no comingSoon", () => {
      const view = renderWithProvider(<ProfessionalMenu />);
      open(view);
      fireEvent.press(view.getByLabelText("Intervalo"));
      expect(comingSoon).toHaveBeenCalled();
    });

    it("com fila, 'Fora' NAO dispara (nao da p/ sumir com cliente esperando)", () => {
      const view = renderWithProvider(<ProfessionalMenu hasQueue />);
      open(view);
      fireEvent.press(view.getByLabelText("Fora"));
      expect(comingSoon).not.toHaveBeenCalled();
    });

    it("sem fila, 'Fora' dispara normalmente", () => {
      const view = renderWithProvider(<ProfessionalMenu hasQueue={false} />);
      open(view);
      fireEvent.press(view.getByLabelText("Fora"));
      expect(comingSoon).toHaveBeenCalled();
    });

    it("'Fechar fila' cai no comingSoon", () => {
      const view = renderWithProvider(<ProfessionalMenu />);
      open(view);
      fireEvent.press(view.getByLabelText("Fechar fila"));
      expect(comingSoon).toHaveBeenCalledWith("Fechar fila");
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
    it("sem sinal nenhum, o gatilho fica limpo", () => {
      const view = renderWithProvider(<ProfessionalMenu />);
      expect(view.queryByTestId("menu-dot")).toBeNull();
    });

    // Andre 2026-07-20: o sinal acende 30min ANTES; o texto acompanha a fase.
    it("refeicao 'proxima' (30min antes): dot aceso e texto de antecedencia", () => {
      const view = renderWithProvider(<ProfessionalMenu mealPhase="proxima" />);
      expect(view.getByTestId("menu-dot")).toBeTruthy();
      open(view);
      expect(view.getByTestId("menu-dot-meals")).toBeTruthy();
      expect(view.getByText(/comeca logo/)).toBeTruthy();
    });

    it("refeicao 'agora': dot aceso e texto de hora chegada", () => {
      const view = renderWithProvider(<ProfessionalMenu mealPhase="agora" />);
      expect(view.getByTestId("menu-dot")).toBeTruthy();
      open(view);
      expect(view.getByText(/esta na hora/)).toBeTruthy();
    });

    it("sem fase, o item de refeicao fica neutro e sem dot", () => {
      const view = renderWithProvider(<ProfessionalMenu />);
      open(view);
      expect(view.queryByTestId("menu-dot-meals")).toBeNull();
      expect(view.getByText(/entram no ETA/)).toBeTruthy();
    });

    it("pendencia de cadastro: dot no gatilho e em Configuracoes", () => {
      const view = renderWithProvider(<ProfessionalMenu settingsDot />);
      expect(view.getByTestId("menu-dot")).toBeTruthy();
      open(view);
      expect(view.getByTestId("menu-dot-settings")).toBeTruthy();
    });

    it("usa o rotulo da proxima refeicao quando informado", () => {
      const view = renderWithProvider(<ProfessionalMenu mealLabel="Almoco 12:00" />);
      open(view);
      expect(view.getByLabelText("Almoco 12:00")).toBeTruthy();
    });
  });

  describe("solicitacoes de corte (C2)", () => {
    it("sem pendentes o item NAO aparece (backend ainda nao informa)", () => {
      const view = renderWithProvider(<ProfessionalMenu />);
      open(view);
      expect(view.queryByLabelText("Solicitacoes")).toBeNull();
    });

    it("com pendentes mostra o item, o contador e acende o dot", () => {
      const view = renderWithProvider(<ProfessionalMenu pendingRequests={2} />);
      expect(view.getByTestId("menu-dot")).toBeTruthy();
      open(view);
      expect(view.getByLabelText("Solicitacoes")).toBeTruthy();
      expect(view.getByTestId("menu-badge-requests")).toBeTruthy();
    });

    it("tocar em Solicitacoes avisa 'em breve' (a tela depende do backend)", () => {
      const view = renderWithProvider(<ProfessionalMenu pendingRequests={1} />);
      open(view);
      fireEvent.press(view.getByLabelText("Solicitacoes"));
      expect(comingSoon).toHaveBeenCalled();
      expect(router.push).not.toHaveBeenCalled();
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
    it("o '‹' do topo fecha (e distinto do 'Sair', que e logout)", () => {
      const view = renderWithProvider(<ProfessionalMenu />);
      open(view);
      fireEvent.press(view.getByLabelText("Voltar"));
      expect(view.queryByLabelText("Refeicoes")).toBeNull();
    });

    it("tocar no card NAO fecha (no-op)", () => {
      const view = renderWithProvider(<ProfessionalMenu />);
      open(view);
      fireEvent.press(view.getByTestId("menu-sheet"));
      expect(view.getByLabelText("Refeicoes")).toBeTruthy();
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
