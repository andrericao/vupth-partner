import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { ExpedienteCard } from "../ExpedienteCard";

describe("ExpedienteCard", () => {
  it("sem expediente registrado: estado vazio, sem horario falso e sem o selo EM BREVE", () => {
    const { getByText, queryByText } = renderWithProvider(<ExpedienteCard periodo="day" />);
    expect(getByText("Sem expediente no período")).toBeTruthy();
    expect(queryByText("--:-- – --:--")).toBeNull();
    expect(queryByText("EM BREVE")).toBeNull();
  });

  // validacao de 17/10: "--:-- – --:--" parecia erro; vazio e calmo (§4).
  it.each(["day", "week", "month"] as const)("%s sem dados: o vazio e texto secundario, nao titulo", (periodo) => {
    const { getByText } = renderWithProvider(<ExpedienteCard periodo={periodo} workdays={[]} />);
    const classes = getByText("Sem expediente no período").props.className;
    expect(classes).toContain("font-body");
    expect(classes).toContain("text-sm");
    expect(classes).toContain("text-vupth-textSecondary");
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
