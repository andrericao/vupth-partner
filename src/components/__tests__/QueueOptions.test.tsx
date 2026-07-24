import { fireEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { QueueOptions } from "../QueueOptions";
import { comingSoon } from "@components/comingSoon";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock("@components/comingSoon", () => ({ comingSoon: jest.fn() }));

// Nav v2: o conteudo e TELA CHEIA (sem modal), entao os itens ja estao
// renderizados — nao ha passo de "abrir menu".
describe("QueueOptions", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("navegacao (so o que NAO esta no rodape)", () => {
    it.each([
      ["Refeicoes", "/(professional)/meals"],
      ["Adicionar cliente", "/(professional)/add-guest"],
    ])("'%s' navega para %s", (label, route) => {
      const view = renderWithProvider(<QueueOptions />);
      fireEvent.press(view.getByLabelText(label));
      expect(router.push).toHaveBeenCalledWith(route);
    });

    it("NAO ha itens duplicados do rodape (Meu dia/Configuracoes) nem Sair", () => {
      const view = renderWithProvider(<QueueOptions />);
      expect(view.queryByLabelText("Meu dia")).toBeNull();
      expect(view.queryByLabelText("Configuracoes")).toBeNull();
      expect(view.queryByLabelText("Sair")).toBeNull();
      expect(view.queryByLabelText("Area do dono")).toBeNull();
    });
  });

  describe("status (S1 fatia 1 ligada)", () => {
    it("toque numa pill diferente dispara onSelect", () => {
      const onSelect = jest.fn();
      const view = renderWithProvider(
        <QueueOptions status={{ current: "trabalhando", onSelect }} />
      );
      fireEvent.press(view.getByLabelText("Intervalo"));
      expect(onSelect).toHaveBeenCalledWith("intervalo");
      expect(comingSoon).not.toHaveBeenCalled();
    });

    it("toque na pill JA ATIVA e no-op", () => {
      const onSelect = jest.fn();
      const view = renderWithProvider(
        <QueueOptions status={{ current: "intervalo", onSelect }} />
      );
      fireEvent.press(view.getByLabelText("Intervalo"));
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("com fila, 'Fora' nao dispara (prevencao de clique)", () => {
      const onSelect = jest.fn();
      const view = renderWithProvider(
        <QueueOptions hasQueue status={{ current: "trabalhando", onSelect }} />
      );
      fireEvent.press(view.getByLabelText("Fora"));
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("current=null cai no default visual e ainda seleciona", () => {
      const onSelect = jest.fn();
      const view = renderWithProvider(<QueueOptions status={{ current: null, onSelect }} />);
      fireEvent.press(view.getByLabelText("Fora"));
      expect(onSelect).toHaveBeenCalledWith("indisponivel");
    });

    // Semaforo (2026-07-23): o icone da linha acompanha o status.
    it.each([
      ["trabalhando", "🟢"],
      ["intervalo", "🟡"],
      ["indisponivel", "🔴"],
    ])("icone da linha Status reflete %s (%s)", (current, emoji) => {
      const view = renderWithProvider(
        <QueueOptions
          status={{ current: current as "trabalhando" | "intervalo" | "indisponivel", onSelect: jest.fn() }}
        />
      );
      expect(view.getByText(emoji)).toBeTruthy();
    });

    it("sem a prop, trocar status cai no comingSoon (fallback)", () => {
      const view = renderWithProvider(<QueueOptions />);
      fireEvent.press(view.getByLabelText("Intervalo"));
      expect(comingSoon).toHaveBeenCalled();
    });

    // Affordance (Andre 2026-07-24): a linha diz o estado atual e convida ao toque.
    it("mostra o estado atual + convite 'toque para trocar'", () => {
      const view = renderWithProvider(
        <QueueOptions status={{ current: "intervalo", onSelect: jest.fn() }} />
      );
      expect(view.getByText(/Voce esta: Intervalo · toque para trocar/)).toBeTruthy();
    });

    it("'Fechar fila' segue comingSoon (fatia 3 do backend)", () => {
      const view = renderWithProvider(<QueueOptions />);
      fireEvent.press(view.getByLabelText("Fechar fila"));
      expect(comingSoon).toHaveBeenCalledWith("Fechar fila");
    });
  });

  describe("refeicoes (contagem sem popup)", () => {
    it("'proxima': dot + contagem regressiva no item", () => {
      const view = renderWithProvider(
        <QueueOptions mealSignal={{ phase: "proxima", minutesUntil: 25 }} />
      );
      expect(view.getByTestId("menu-dot-meals")).toBeTruthy();
      expect(view.getByText(/em 25 min/)).toBeTruthy();
    });

    it("'agora': texto de hora chegada", () => {
      const view = renderWithProvider(
        <QueueOptions mealSignal={{ phase: "agora", minutesUntil: 0 }} />
      );
      expect(view.getByText(/esta na hora/)).toBeTruthy();
    });

    it("sem fase: item neutro, sem dot; usa mealLabel quando informado", () => {
      const view = renderWithProvider(<QueueOptions mealLabel="Almoco 12:00" />);
      expect(view.queryByTestId("menu-dot-meals")).toBeNull();
      expect(view.getByLabelText("Almoco 12:00")).toBeTruthy();
      expect(view.getByText(/entram no ETA/)).toBeTruthy();
    });
  });

  describe("solicitacoes de corte", () => {
    it("sem pendentes o item nao aparece", () => {
      const view = renderWithProvider(<QueueOptions />);
      expect(view.queryByLabelText("Solicitacoes")).toBeNull();
    });

    it("com pendentes: badge + onOpenRequests abre a lista", () => {
      const onOpenRequests = jest.fn();
      const view = renderWithProvider(
        <QueueOptions pendingRequests={2} onOpenRequests={onOpenRequests} />
      );
      expect(view.getByTestId("menu-badge-requests")).toBeTruthy();
      fireEvent.press(view.getByLabelText("Solicitacoes"));
      expect(onOpenRequests).toHaveBeenCalled();
    });

    it("sem handler cai no 'em breve' (fallback)", () => {
      const view = renderWithProvider(<QueueOptions pendingRequests={1} />);
      fireEvent.press(view.getByLabelText("Solicitacoes"));
      expect(comingSoon).toHaveBeenCalled();
    });
  });

  // Decisao Andre 2026-07-24: o profissional NAO abre/fecha a loja na mao — o
  // botao saiu. A loja e derivada do status (Trabalhando abre; Fora fecha); o
  // aviso "voce e o primeiro/ultimo" mora na tela, nao neste componente.
  describe("estabelecimento (removido — so status)", () => {
    it("nao ha mais botao de abrir/fechar estabelecimento", () => {
      const view = renderWithProvider(
        <QueueOptions status={{ current: "indisponivel", onSelect: jest.fn() }} />
      );
      expect(view.queryByLabelText("Abrir estabelecimento")).toBeNull();
      expect(view.queryByLabelText("Fora do horario")).toBeNull();
    });
  });
});
