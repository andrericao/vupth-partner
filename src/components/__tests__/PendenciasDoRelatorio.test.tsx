import { render, fireEvent } from "@testing-library/react-native";
import { PendenciasDoRelatorio } from "@components/PendenciasDoRelatorio";

// relatorio-com-pendencias: a secao recolhida de Relatorios.
const BASE = { totalAttendances: 2, totalRevenue: 60, avgDurationMinutes: 20, topService: null };

describe("PendenciasDoRelatorio", () => {
  it("sem os campos do Backend, nao aparece", () => {
    const r = render(<PendenciasDoRelatorio report={BASE} />);
    expect(r.queryByTestId("pendencias-secao")).toBeNull();
  });

  it("aberta, mostra os totais e os cortes com a divida", () => {
    const report = {
      ...BASE,
      receives_total: 54,
      fees_total: 6,
      pending_debt_total: 2.9,
      cuts: [
        { attendance_id: "a", receives: 27, fees: 3, pending_debt: 2.9 },
        { attendance_id: "b", receives: 27, fees: 3, pending_debt: 0 },
        { attendance_id: "legado", receives: null, fees: null },
      ],
    };
    const r = render(<PendenciasDoRelatorio report={report} />);
    fireEvent.press(r.getByTestId("pendencias-secao-titulo"));
    expect(r.getByText("R$ 54,00")).toBeTruthy();
    expect(r.getByTestId("pendencias-divida").props.children).toBe("R$ 2,90");
    expect(r.getAllByTestId("pendencias-corte")).toHaveLength(2);
    expect(r.getByText("Recebe R$ 27,00 · Taxas R$ 3,00 · Dívida R$ 2,90")).toBeTruthy();
  });

  it("sem divida real, a de teste aparece marcada", () => {
    const r = render(
      <PendenciasDoRelatorio report={{ ...BASE, receives_total: 54, fees_total: 6, pending_debt_simulated_total: 5.8 }} />
    );
    fireEvent.press(r.getByTestId("pendencias-secao-titulo"));
    expect(r.getByTestId("pendencias-divida-teste").props.children).toBe("R$ 5,80");
    expect(r.queryByTestId("pendencias-divida")).toBeNull();
    expect(r.queryByTestId("pendencias-cortes")).toBeNull();
  });
});
