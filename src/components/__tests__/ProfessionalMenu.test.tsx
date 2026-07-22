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

  // S1 fatia 1 LIGADA (2026-07-22): com a prop `status`, as pills refletem o
  // work_status real e o toque dispara onSelect (queue.tsx chama o PATCH).
  describe("status (S1 fatia 1 ligada)", () => {
    it("toque numa pill diferente dispara onSelect com a chave certa", () => {
      const onSelect = jest.fn();
      const view = renderWithProvider(
        <ProfessionalMenu status={{ current: "trabalhando", onSelect }} />
      );
      open(view);
      fireEvent.press(view.getByLabelText("Intervalo"));
      expect(onSelect).toHaveBeenCalledWith("intervalo");
      expect(comingSoon).not.toHaveBeenCalled();
    });

    it("toque na pill JA ATIVA e no-op (nao repete o PATCH)", () => {
      const onSelect = jest.fn();
      const view = renderWithProvider(
        <ProfessionalMenu status={{ current: "intervalo", onSelect }} />
      );
      open(view);
      fireEvent.press(view.getByLabelText("Intervalo"));
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("com fila, 'Fora' nao dispara nem com a prop ligada (prevencao de clique)", () => {
      const onSelect = jest.fn();
      const view = renderWithProvider(
        <ProfessionalMenu hasQueue status={{ current: "trabalhando", onSelect }} />
      );
      open(view);
      fireEvent.press(view.getByLabelText("Fora"));
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("current=null (backend sem o campo) cai no default visual e ainda seleciona", () => {
      const onSelect = jest.fn();
      const view = renderWithProvider(
        <ProfessionalMenu status={{ current: null, onSelect }} />
      );
      open(view);
      fireEvent.press(view.getByLabelText("Fora"));
      expect(onSelect).toHaveBeenCalledWith("indisponivel");
    });
  });

  describe("status (fallback sem prop = stub)", () => {
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

    // Andre 2026-07-20: acende 30min ANTES e "sem intromissao na tela" — o
    // aviso e a CONTAGEM aqui no item, nao um popup.
    it("refeicao 'proxima': dot aceso e CONTAGEM regressiva no item", () => {
      const view = renderWithProvider(
        <ProfessionalMenu mealSignal={{ phase: "proxima", minutesUntil: 25 }} />
      );
      expect(view.getByTestId("menu-dot")).toBeTruthy();
      open(view);
      expect(view.getByTestId("menu-dot-meals")).toBeTruthy();
      expect(view.getByText(/em 25 min/)).toBeTruthy();
    });

    it("refeicao 'agora': dot aceso e texto de hora chegada", () => {
      const view = renderWithProvider(
        <ProfessionalMenu mealSignal={{ phase: "agora", minutesUntil: 0 }} />
      );
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

    // C2 desbloqueado (2026-07-22): com o handler, o toque abre o modal real.
    it("com onOpenRequests, tocar em Solicitacoes abre o modal (nao e mais stub)", () => {
      const onOpenRequests = jest.fn();
      const view = renderWithProvider(
        <ProfessionalMenu pendingRequests={2} onOpenRequests={onOpenRequests} />
      );
      open(view);
      fireEvent.press(view.getByLabelText("Solicitacoes"));
      expect(onOpenRequests).toHaveBeenCalled();
      expect(comingSoon).not.toHaveBeenCalled();
    });

    it("sem o handler, cai no 'em breve' (fallback)", () => {
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
        <ProfessionalMenu establishment={{ isOpen: false, isOpenNow: false, onToggle }} />
      );
      open(view);
      expect(view.getByText(/FECHADA agora/)).toBeTruthy();
      fireEvent.press(view.getByLabelText("Abrir estabelecimento"));
      expect(onToggle).toHaveBeenCalled();
    });

    it("loja aberta e dentro do horario: oferece FECHAR e dispara o toggle", () => {
      const onToggle = jest.fn();
      const view = renderWithProvider(
        <ProfessionalMenu establishment={{ isOpen: true, isOpenNow: true, onToggle }} />
      );
      open(view);
      expect(view.getByText(/ABERTA agora/)).toBeTruthy();
      fireEvent.press(view.getByLabelText("Fechar estabelecimento"));
      expect(onToggle).toHaveBeenCalled();
    });

    // O caso que motivou usar o `is_open` do backend: a chave manual segue em
    // OPEN, mas o horario ja venceu — o cliente ve fechado e o gate barra a
    // entrada. Dizer "ABERTA agora" aqui seria mentir para o profissional.
    it("aberta porem FORA DO HORARIO: avisa que clientes nao entram", () => {
      const onToggle = jest.fn();
      const view = renderWithProvider(
        <ProfessionalMenu establishment={{ isOpen: true, isOpenNow: false, onToggle }} />
      );
      open(view);
      expect(view.getByText(/FORA DO HORARIO/)).toBeTruthy();
      expect(view.queryByText(/ABERTA agora/)).toBeNull();
      // continua sendo a acao de fechar (a chave manual esta em OPEN)
      expect(view.getByLabelText("Fechar estabelecimento")).toBeTruthy();
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
