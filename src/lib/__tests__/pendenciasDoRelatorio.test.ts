import { resumoDePendencias, linhaDoCorte, horaDoCorte } from "@lib/pendenciasDoRelatorio";

// relatorio-com-pendencias (DEC-109; Backend de0af2e).
const BASE = { totalAttendances: 2, totalRevenue: 60, avgDurationMinutes: 20, topService: null };

describe("pendenciasDoRelatorio", () => {
  it("backend antigo, sem os campos: sem secao", () => {
    expect(resumoDePendencias(null)).toBeNull();
    expect(resumoDePendencias(undefined)).toBeNull();
    expect(resumoDePendencias(BASE)).toBeNull();
  });

  it("o resumo do periodo: recebe, taxas, divida e a de teste a parte", () => {
    const r = resumoDePendencias({
      ...BASE,
      receives_total: 54,
      fees_total: 6,
      pending_debt_total: 2.9,
      pending_debt_simulated_total: 0,
    });
    expect(r).toEqual({ recebe: 54, taxas: 6, divida: 2.9, simulada: 0 });
    expect(resumoDePendencias({ ...BASE, receives_total: "10" as any, pending_debt_simulated_total: 5.8 })).toEqual({
      recebe: 10,
      taxas: null,
      divida: 0,
      simulada: 5.8,
    });
  });

  it("a linha do corte traz so o que vier; divida real vence a de teste", () => {
    expect(linhaDoCorte({ attendance_id: "a", receives: 27, fees: 3, pending_debt: 2.9 })).toBe(
      "Recebe R$ 27,00 · Taxas R$ 3,00 · Dívida R$ 2,90"
    );
    expect(linhaDoCorte({ attendance_id: "b", receives: 27, fees: 3, pending_debt: 0, pending_debt_simulated: 2.9 })).toBe(
      "Recebe R$ 27,00 · Taxas R$ 3,00 · Dívida R$ 2,90 (teste)"
    );
    expect(linhaDoCorte({ attendance_id: "c", receives: null, fees: null })).toBe("");
  });

  it("a hora do corte", () => {
    expect(horaDoCorte({ finished_at: new Date(2026, 9, 23, 14, 5).toISOString() })).toBe("14:05");
    expect(horaDoCorte({ finished_at: null })).toBe("");
    expect(horaDoCorte({ finished_at: "lixo" })).toBe("");
  });
});
