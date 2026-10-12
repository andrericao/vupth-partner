import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { LinhaDoPagamento } from "@components/LinhaDoPagamento";

// pagamento-pix (contrato 2a2b0ec): o status do pagamento no historico; o dono
// tambem marca "Recebi".
describe("LinhaDoPagamento", () => {
  it("sem pagamento, nada aparece", () => {
    const { toJSON } = render(<LinhaDoPagamento status={null} />);
    expect(toJSON()).toBeNull();
  });

  it("pago: so o rotulo, sem botao", () => {
    const { getByText, queryByText } = render(<LinhaDoPagamento status="PAID" onRecebi={jest.fn()} />);
    expect(getByText("Pagamento: pago")).toBeTruthy();
    expect(queryByText("Recebi")).toBeNull();
  });

  it("pendente sem onRecebi (o profissional confere nos pendentes): sem botao", () => {
    const { getByText, queryByText } = render(<LinhaDoPagamento status="PENDING" />);
    expect(getByText("Pagamento: aguardando pagamento")).toBeTruthy();
    expect(queryByText("Recebi")).toBeNull();
  });

  it("pendente com onRecebi (o dono): o botao confirma", async () => {
    const onRecebi = jest.fn().mockResolvedValue(undefined);
    const { getByText } = render(<LinhaDoPagamento status="AWAITING_CONFIRMATION" onRecebi={onRecebi} />);
    expect(getByText("Pagamento: pagamento a confirmar")).toBeTruthy();
    fireEvent.press(getByText("Recebi"));
    await waitFor(() => expect(onRecebi).toHaveBeenCalled());
  });
});
