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

  describe("navegacao (só o que NAO esta no rodape)", () => {
    it.each([
      ["Refeições", "/(professional)/meals?from=queue-options"],
    ])("'%s' navega para %s", (label, route) => {
      const view = renderWithProvider(<QueueOptions />);
      fireEvent.press(view.getByLabelText(label));
      expect(router.push).toHaveBeenCalledWith(route);
    });

    it("'Adicionar cliente' NAO mora mais aqui — foi pra tela da Fila (DS3)", () => {
      // Era a acao mais frequente do dia a tres toques de distancia, no mesmo
      // lugar do status. Se voltar pra ca, volta o problema.
      const view = renderWithProvider(<QueueOptions />);
      expect(view.queryByLabelText("Adicionar cliente")).toBeNull();
    });

    it("NAO ha itens duplicados do rodape (Relatorios/Configuracoes) nem Sair", () => {
      const view = renderWithProvider(<QueueOptions />);
      expect(view.queryByLabelText("Relatórios")).toBeNull();
      expect(view.queryByLabelText("Configurações")).toBeNull();
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

    it("com fila, 'Fora' não dispara (prevencao de clique)", () => {
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
    ])("ícone da linha Status reflete %s (%s)", (current, emoji) => {
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
      expect(view.getByText(/Você está: Intervalo · toque para trocar/)).toBeTruthy();
    });

    it("sem a prop closeQueue, 'Fechar fila' cai no comingSoon (fallback)", () => {
      const view = renderWithProvider(<QueueOptions />);
      fireEvent.press(view.getByLabelText("Fechar fila"));
      expect(comingSoon).toHaveBeenCalledWith("Fechar fila");
    });
  });

  describe("fechar / reabrir fila (S1 fatia 3)", () => {
    it("aceitando novos: mostra 'Fechar fila' e dispara onToggle (sem comingSoon)", () => {
      const onToggle = jest.fn();
      const view = renderWithProvider(
        <QueueOptions closeQueue={{ acceptingNew: true, onToggle }} />
      );
      fireEvent.press(view.getByLabelText("Fechar fila"));
      expect(onToggle).toHaveBeenCalled();
      expect(comingSoon).not.toHaveBeenCalled();
    });

    it("fila fechada (drenando): vira 'Reabrir fila' e dispara onToggle", () => {
      const onToggle = jest.fn();
      const view = renderWithProvider(
        <QueueOptions closeQueue={{ acceptingNew: false, onToggle }} />
      );
      expect(view.queryByLabelText("Fechar fila")).toBeNull();
      fireEvent.press(view.getByLabelText("Reabrir fila"));
      expect(onToggle).toHaveBeenCalled();
    });
  });

  describe("refeições (contagem sem popup)", () => {
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
      expect(view.getByText(/está na hora/)).toBeTruthy();
    });

    it("sem fase: item neutro, sem dot; usa mealLabel quando informado", () => {
      const view = renderWithProvider(<QueueOptions mealLabel="Almoço 12:00" />);
      expect(view.queryByTestId("menu-dot-meals")).toBeNull();
      expect(view.getByLabelText("Almoço 12:00")).toBeTruthy();
      expect(view.getByText(/entram no ETA/)).toBeTruthy();
    });
  });

  describe("solicitações de corte", () => {
    it("sem pendentes o item não aparece", () => {
      const view = renderWithProvider(<QueueOptions />);
      expect(view.queryByLabelText("Solicitações")).toBeNull();
    });

    it("com pendentes: badge + onOpenRequests abre a lista", () => {
      const onOpenRequests = jest.fn();
      const view = renderWithProvider(
        <QueueOptions pendingRequests={2} onOpenRequests={onOpenRequests} />
      );
      expect(view.getByTestId("menu-badge-requests")).toBeTruthy();
      fireEvent.press(view.getByLabelText("Solicitações"));
      expect(onOpenRequests).toHaveBeenCalled();
    });

    it("sem handler cai no 'em breve' (fallback)", () => {
      const view = renderWithProvider(<QueueOptions pendingRequests={1} />);
      fireEvent.press(view.getByLabelText("Solicitações"));
      expect(comingSoon).toHaveBeenCalled();
    });
  });

  // Decisao Andre 2026-07-24: o profissional NAO abre/fecha a loja na mao — o
  // botao saiu. A loja e derivada do status (Trabalhando abre; Fora fecha); o
  // aviso "voce e o primeiro/ultimo" mora na tela, nao neste componente.
  describe("estabelecimento (removido — só status)", () => {
    it("não há mais botão de abrir/fechar estabelecimento", () => {
      const view = renderWithProvider(
        <QueueOptions status={{ current: "indisponivel", onSelect: jest.fn() }} />
      );
      expect(view.queryByLabelText("Abrir estabelecimento")).toBeNull();
      expect(view.queryByLabelText("Fora do horário")).toBeNull();
    });
  });
});
