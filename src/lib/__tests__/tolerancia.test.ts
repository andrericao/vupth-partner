import fs from "fs";
import path from "path";

import {
  dentroDaTolerancia,
  avisoDaTolerancia,
  faixaDaTolerancia,
  liberacaoDoAtraso,
  atrasoTravado,
  avisoDoPrimeiroDoDia,
  type NoShowStatus,
} from "../tolerancia";

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

// atraso-so-apos-tolerancia (DEC-185, Backend c38ba90).
describe("primeiro agendado do dia: atraso so depois de horario + 10", () => {
  const erro = (status: number, data: any) => ({ response: { status, data } });

  it("le o available_at so do 409 LATE_TOO_EARLY", () => {
    expect(liberacaoDoAtraso(erro(409, { code: "LATE_TOO_EARLY", available_at: "2026-11-04T09:10:00-03:00" }))).toBe(
      "2026-11-04T09:10:00-03:00"
    );
    expect(liberacaoDoAtraso(erro(409, { code: "NO_SHOW_TOO_EARLY", available_at: "x" }))).toBeNull();
    expect(liberacaoDoAtraso(erro(422, { code: "LATE_TOO_EARLY", available_at: "x" }))).toBeNull();
    expect(liberacaoDoAtraso(erro(409, { code: "LATE_TOO_EARLY" }))).toBeNull();
    expect(liberacaoDoAtraso(new Error("rede"))).toBeNull();
    expect(liberacaoDoAtraso(undefined)).toBeNull();
  });

  it("trava ate o available_at e solta depois", () => {
    const libera = "2026-11-04T12:10:00Z";
    const t = new Date(libera).getTime();
    expect(atrasoTravado(libera, t - 1000)).toBe(true);
    expect(atrasoTravado(libera, t)).toBe(false);
    expect(atrasoTravado(libera, t + 1000)).toBe(false);
    expect(atrasoTravado(undefined, t)).toBe(false);
    expect(atrasoTravado("nao-e-data", t)).toBe(false);
  });

  it("o aviso diz a hora em que o atraso libera", () => {
    const libera = new Date(2026, 10, 4, 9, 10).toISOString();
    expect(avisoDoPrimeiroDoDia(libera)).toBe(
      "Primeiro horário do dia: tem 10 minutos de tolerância. O atraso só pode ser marcado a partir das 09:10."
    );
    expect(avisoDoPrimeiroDoDia(null)).toBe("Primeiro horário do dia: tem 10 minutos de tolerância.");
  });

  it("a fila trata o 409 e trava o Nao chegou do primeiro do dia", () => {
    const tela = fs.readFileSync(path.resolve(__dirname, "../../../app/(professional)/queue.tsx"), "utf8");
    expect(tela).toContain("liberacaoDoAtraso(error)");
    expect(tela).toContain("setAtrasoLiberaEm(");
    expect(tela).toMatch(/naoChegouDesativado = .*\|\| primeiroDoDiaTravado/);
  });
});
