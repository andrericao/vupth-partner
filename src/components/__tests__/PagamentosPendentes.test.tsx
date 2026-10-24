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
    await waitFor(() => expect(onRecebi).toHaveBeenCalledWith("a2"));
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
});
