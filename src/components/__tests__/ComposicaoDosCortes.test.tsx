import { fireEvent } from "@testing-library/react-native";
import { renderWithProvider as render } from "../../test-utils/renderWithProvider";
import { ComposicaoDosCortes } from "../ComposicaoDosCortes";

const corte = (extra = {}) => ({
  attendance_id: "a1",
  finished_at: "2026-11-03T14:30:00",
  composition: { service: 50, gateway_fee: 1.99, app_fee: 1, penalty: 5, total: 57.99, charged: false, goes_to: { penalty: "professional" } },
  ...extra,
});

describe("ComposicaoDosCortes", () => {
  it("sem composicao no periodo: nao aparece", () => {
    expect(render(<ComposicaoDosCortes report={null} />).queryByTestId("composicao-dos-cortes-secao")).toBeNull();
    const r = { cuts: [{ attendance_id: "a1" }] } as any;
    expect(render(<ComposicaoDosCortes report={r} />).queryByTestId("composicao-dos-cortes-secao")).toBeNull();
  });

  it("modo teste: taxas riscadas, 'Não cobrada no teste' e a multa", () => {
    const r = { cuts: [corte()] } as any;
    const { getByTestId, getByText, getAllByText } = render(<ComposicaoDosCortes report={r} />);
    fireEvent.press(getByText("Para onde vai cada valor"));
    expect(getAllByText("Não cobrada no teste")).toHaveLength(2);
    const taxa = getByTestId("composicao-gateway_fee");
    expect(JSON.stringify(taxa.props.style)).toContain("line-through");
    expect(JSON.stringify(getByTestId("composicao-service").props.style ?? "")).not.toContain("line-through");
    expect(getByText("Multa")).toBeTruthy();
    expect(getByText("Vai para você")).toBeTruthy();
    expect(getByText("Cliente pagou")).toBeTruthy();
  });
});
