import { dentroDaTolerancia, avisoDaTolerancia, faixaDaTolerancia, type NoShowStatus } from "../tolerancia";

const s = (o: Partial<NoShowStatus>): NoShowStatus => ({ attendance_id: "a", is_first: true, can_mark_no_show: false, ...o });

// menu-da-fila-nao-chegou-tolerancia (Andre, 24/10).
describe("tolerancia do Nao chegou", () => {
  it("dentro: TOO_EARLY com segundos por vir; fora: sem resposta, pode marcar, ou nao e o primeiro", () => {
    expect(dentroDaTolerancia(s({ reason: "TOO_EARLY", seconds_left: 61 }))).toBe(true);
    expect(dentroDaTolerancia(undefined)).toBe(false);
    expect(dentroDaTolerancia(s({ can_mark_no_show: true, seconds_left: 0 }))).toBe(false);
    expect(dentroDaTolerancia(s({ reason: "TOO_EARLY", seconds_left: 0 }))).toBe(false);
    expect(dentroDaTolerancia(s({ reason: "NOT_FIRST", seconds_left: null }))).toBe(false);
  });

  it("o aviso diz os minutos de tolerancia (10 por padrao)", () => {
    expect(avisoDaTolerancia(s({ wait_minutes: 10 }))).toBe("Tem 10 minutos de tolerância.");
    expect(avisoDaTolerancia(undefined)).toBe("Tem 10 minutos de tolerância.");
    expect(avisoDaTolerancia(s({ wait_minutes: 15 }))).toBe("Tem 15 minutos de tolerância.");
  });

  it("a faixa conta o que falta, arredondando para cima; fora da tolerancia nao existe", () => {
    expect(faixaDaTolerancia(s({ reason: "TOO_EARLY", seconds_left: 61, wait_minutes: 10 }))).toBe(
      "Tolerância de 10 minutos: faltam 2 min"
    );
    expect(faixaDaTolerancia(s({ can_mark_no_show: true, seconds_left: 0 }))).toBeNull();
    expect(faixaDaTolerancia(undefined)).toBeNull();
  });
});
