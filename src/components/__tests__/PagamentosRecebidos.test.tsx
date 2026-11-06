import { render } from "@testing-library/react-native";
import { PagamentosRecebidos } from "@components/PagamentosRecebidos";
import type { PagamentoRecebido } from "@lib/pagamentosRecebidos";

jest.setTimeout(20000);
const P: PagamentoRecebido = {
  id: "p1",
  campaign_name: "Teste de Lançamento",
  type: "PAYMENT",
  amount: 5,
  paid_at: "2026-11-06T14:30:00-03:00",
  note: "PIX 123",
};

describe("PagamentosRecebidos", () => {
  it("sem pagamento, nada", () => {
    const { queryByTestId } = render(<PagamentosRecebidos itens={[{ ...P, type: "REVERSAL" }]} />);
    expect(queryByTestId("pagamentos-recebidos")).toBeNull();
  });

  it("mostra a campanha, pago em dd/mm e a nota", () => {
    const { getByText, getByTestId } = render(<PagamentosRecebidos itens={[P]} />);
    expect(getByText("Teste de Lançamento")).toBeTruthy();
    expect(getByTestId("pagamento-estado-p1").props.children).toBe("pago em 06/11");
    expect(getByTestId("pagamento-nota-p1").props.children).toBe("PIX 123");
  });

  it("sem nota, sem a linha da nota", () => {
    const { queryByTestId } = render(<PagamentosRecebidos itens={[{ ...P, note: null }]} />);
    expect(queryByTestId("pagamento-nota-p1")).toBeNull();
  });
});
