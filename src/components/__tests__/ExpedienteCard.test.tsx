import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { ExpedienteCard } from "../ExpedienteCard";

describe("ExpedienteCard", () => {
  it("sem expediente registrado: placeholder, sem o selo EM BREVE", () => {
    const { getByText, queryByText } = renderWithProvider(<ExpedienteCard periodo="day" />);
    expect(getByText("--:-- – --:--")).toBeTruthy();
    expect(queryByText("EM BREVE")).toBeNull();
  });

  it("Hoje: mostra a faixa do expediente", () => {
    const { getByText } = renderWithProvider(
      <ExpedienteCard
        periodo="day"
        workdays={[{ date: "2026-10-03", start: "08:10", end: "18:40", workedMinutes: 630 }]}
      />
    );
    expect(getByText("08:10–18:40")).toBeTruthy();
  });

  it("Semana: total trabalhado com o detalhe dos dias", () => {
    const { getByText } = renderWithProvider(
      <ExpedienteCard
        periodo="week"
        workdays={[{ date: "2026-10-03", start: "08:00", end: "10:00", workedMinutes: 120 }]}
      />
    );
    expect(getByText("2h00")).toBeTruthy();
    expect(getByText("em 1 dia")).toBeTruthy();
  });
});
