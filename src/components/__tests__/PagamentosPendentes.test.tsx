import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { PagamentosPendentes } from "@components/PagamentosPendentes";

const ITENS = [
  {
    attendance_id: "a1",
    status: "AWAITING_CONFIRMATION" as const,
    amount: 45,
    client_name: "Ana",
    finished_at: "2026-10-11T15:00:00Z",
    claimed_at: "2026-10-11T15:10:00Z",
  },
  {
    attendance_id: "a2",
    status: "PENDING" as const,
    amount: 31.9,
    client_name: "Bia",
    finished_at: "2026-10-11T16:00:00Z",
    claimed_at: null,
  },
];

// Sem rede no teste: o calculo do desconto (DEC-127) vem injetado. Antes o card chamava a API de
// verdade e o CI, mais lento que o PC, estourava o waitFor (29/10).
const semCalculo = async () => null;

describe("PagamentosPendentes", () => {
  it("sem pendencia, nao aparece", () => {
    const { queryByTestId } = render(<PagamentosPendentes itens={[]} onRecebi={jest.fn()} />);
    expect(queryByTestId("pagamentos-pendentes")).toBeNull();
  });

  it("lista o cliente, o valor e a observacao de cada um", () => {
    const { getByText, getByTestId } = render(<PagamentosPendentes itens={ITENS} onRecebi={jest.fn()} />);
    expect(getByTestId("pagamentos-pendentes")).toBeTruthy();
    expect(getByText("Ana")).toBeTruthy();
    expect(getByText("R$ 45,00")).toBeTruthy();
    expect(getByText("Confirme se o pagamento foi efetuado")).toBeTruthy();
    expect(getByText("Aguardando o cliente efetuar o pagamento")).toBeTruthy();
    expect(getByTestId("pagamento-dot-a1")).toBeTruthy();
  });

  it("o Recebi diz de quem e (leitor de tela e a bateria)", () => {
    const { getByLabelText } = render(<PagamentosPendentes itens={ITENS} onRecebi={jest.fn()} />);
    expect(getByLabelText("Recebi de Bia")).toBeTruthy();
  });

  it("Recebi confirma aquele atendimento", async () => {
    const onRecebi = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(<PagamentosPendentes itens={ITENS} onRecebi={onRecebi} />);
    fireEvent.press(getByTestId("recebi-a2"));
    await waitFor(() => expect(onRecebi).toHaveBeenCalledWith("a2", false));
  });

  // pagamento-pelo-asaas-no-partner (DEC-119).
  // pagamento-ja-recebi (Andre, 24/10): o Recebi fica sempre visivel.
  it("Asaas conectado no sandbox: o Recebi segue visivel, o app avisa que confirma sozinho, e a faixa de teste aparece", () => {
    const { getByTestId } = render(
      <PagamentosPendentes itens={ITENS} onRecebi={jest.fn()} gateway={{ connected: true, mode: "SANDBOX" }} />
    );
    expect(getByTestId("recebi-a1")).toBeTruthy();
    expect(getByTestId("recebi-a2")).toBeTruthy();
    expect(getByTestId("pelo-app-a1")).toBeTruthy();
    expect(getByTestId("pagamentos-faixa-teste")).toBeTruthy();
  });

  it("Asaas real: Recebi visivel e sem faixa de teste; desconectado: o Recebi de sempre e sem o aviso", () => {
    const real = render(
      <PagamentosPendentes itens={ITENS} onRecebi={jest.fn()} gateway={{ connected: true, mode: "REAL" }} />
    );
    expect(real.getByTestId("recebi-a1")).toBeTruthy();
    expect(real.queryByTestId("pagamentos-faixa-teste")).toBeNull();
    real.unmount();
    const fora = render(<PagamentosPendentes itens={ITENS} onRecebi={jest.fn()} gateway={{ connected: false }} />);
    expect(fora.getByTestId("recebi-a1")).toBeTruthy();
    expect(fora.queryByTestId("pelo-app-a1")).toBeNull();
  });

  // relatorios-pendentes-clicaveis (Andre, 24/10): tocar no card abre o atendimento.
  describe("tocar no card", () => {
    it("abre a caixa com Confirmar recebimento e Recusar (ja paguei) e confirma sem perguntar de novo", async () => {
      const abrir = jest.fn().mockResolvedValue(0);
      const onRecebi = jest.fn().mockResolvedValue(undefined);
      const { getByTestId } = render(
        <PagamentosPendentes itens={ITENS} onRecebi={onRecebi} onRecusar={jest.fn()} abrir={abrir} buscarCalculo={semCalculo} />
      );
      fireEvent.press(getByTestId("pagamento-a1"));
      await waitFor(() => expect(onRecebi).toHaveBeenCalledWith("a1", true));
      const pedido = abrir.mock.calls[0][0];
      expect(pedido.titulo).toBe("Ana");
      expect(pedido.botoes.map((b: { texto: string }) => b.texto)).toEqual(["Confirmar recebimento", "Recusar", "Fechar"]);
    });

    it("Recusar chama onRecusar", async () => {
      const abrir = jest.fn().mockResolvedValue(1);
      const onRecusar = jest.fn().mockResolvedValue(undefined);
      const { getByTestId } = render(
        <PagamentosPendentes itens={ITENS} onRecebi={jest.fn()} onRecusar={onRecusar} abrir={abrir} buscarCalculo={semCalculo} />
      );
      fireEvent.press(getByTestId("pagamento-a1"));
      await waitFor(() => expect(onRecusar).toHaveBeenCalledWith("a1"));
    });

    it("pendente sem 'ja paguei': so Confirmar recebimento e Fechar (nao ha o que recusar)", async () => {
      const abrir = jest.fn().mockResolvedValue(2);
      const onRecusar = jest.fn();
      const onRecebi = jest.fn();
      const { getByTestId } = render(
        <PagamentosPendentes itens={ITENS} onRecebi={onRecebi} onRecusar={onRecusar} abrir={abrir} buscarCalculo={semCalculo} />
      );
      fireEvent.press(getByTestId("pagamento-a2"));
      await waitFor(() => expect(abrir).toHaveBeenCalled());
      expect(abrir.mock.calls[0][0].botoes.map((b: { texto: string }) => b.texto)).toEqual(["Confirmar recebimento", "Fechar"]);
      expect(onRecusar).not.toHaveBeenCalled();
      expect(onRecebi).not.toHaveBeenCalled();
    });

    it("Fechar nao faz nada", async () => {
      const abrir = jest.fn().mockResolvedValue(2);
      const onRecebi = jest.fn();
      const onRecusar = jest.fn();
      const { getByTestId } = render(
        <PagamentosPendentes itens={ITENS} onRecebi={onRecebi} onRecusar={onRecusar} abrir={abrir} buscarCalculo={semCalculo} />
      );
      fireEvent.press(getByTestId("pagamento-a1"));
      await waitFor(() => expect(abrir).toHaveBeenCalled());
      expect(onRecebi).not.toHaveBeenCalled();
      expect(onRecusar).not.toHaveBeenCalled();
    });

    it("com desconto: a caixa do card traz a flag e o calculo (DEC-127)", async () => {
      const abrir = jest.fn().mockResolvedValue(2);
      const calculo = {
        discounted: true,
        list_price: 32.9,
        discount: 10,
        penalties: 0,
        client_pays: 22.9,
        pro_receives: 30,
        app_pays: 7.1,
      };
      const { getByTestId } = render(
        <PagamentosPendentes itens={ITENS} onRecebi={jest.fn()} abrir={abrir} buscarCalculo={async () => calculo} />
      );
      fireEvent.press(getByTestId("pagamento-a2"));
      await waitFor(() => expect(abrir).toHaveBeenCalled());
      const mensagem: string = abrir.mock.calls[0][0].mensagem;
      expect(mensagem).toContain("PAGAMENTO COM DESCONTO");
      expect(mensagem).toContain("Valor do corte: R$ 32,90");
      expect(mensagem).toContain("O app cobre: R$ 7,10");
    });

    it("sem desconto: a mensagem fica como era", async () => {
      const abrir = jest.fn().mockResolvedValue(2);
      const { getByTestId } = render(
        <PagamentosPendentes itens={ITENS} onRecebi={jest.fn()} abrir={abrir} buscarCalculo={semCalculo} />
      );
      fireEvent.press(getByTestId("pagamento-a2"));
      await waitFor(() => expect(abrir).toHaveBeenCalled());
      expect(abrir.mock.calls[0][0].mensagem).toBe("R$ 31,90 · Aguardando o cliente efetuar o pagamento");
    });
  });
});
