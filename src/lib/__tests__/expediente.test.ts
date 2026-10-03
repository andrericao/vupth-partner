import { horaDoTurno, resumoDoExpediente, type DiaDeExpediente } from "../expediente";

const dia = (p: Partial<DiaDeExpediente>): DiaDeExpediente => ({
  date: "2026-10-03",
  start: "08:10",
  end: "18:40",
  workedMinutes: 600,
  ...p,
});

describe("horaDoTurno", () => {
  it("le o horario de um data-hora ISO no relogio do aparelho", () => {
    const iso = new Date(2026, 9, 3, 7, 5).toISOString();
    expect(horaDoTurno(iso)).toBe("07:05");
  });

  it("le um horario solto (HH:mm[:ss])", () => {
    expect(horaDoTurno("09:30:00")).toBe("09:30");
  });

  it("null para vazio ou invalido", () => {
    expect(horaDoTurno(null)).toBeNull();
    expect(horaDoTurno(undefined)).toBeNull();
    expect(horaDoTurno("amanha")).toBeNull();
    expect(horaDoTurno("2026-99-99Tzz")).toBeNull();
  });
});

describe("resumoDoExpediente", () => {
  it("sem workdays (backend antigo ou dia antes do deploy): null", () => {
    expect(resumoDoExpediente(undefined, "day")).toBeNull();
    expect(resumoDoExpediente([], "week")).toBeNull();
    expect(resumoDoExpediente([dia({ start: null })], "day")).toBeNull();
  });

  it("Hoje: a faixa do dia", () => {
    expect(resumoDoExpediente([dia({})], "day")).toEqual({ valor: "08:10–18:40" });
  });

  it("Hoje com alguem ainda em expediente: termina em 'agora'", () => {
    expect(resumoDoExpediente([dia({ end: null })], "day")).toEqual({ valor: "08:10–agora" });
  });

  it("Hoje com mais de um dia na lista: usa o ultimo", () => {
    const r = resumoDoExpediente(
      [dia({ date: "2026-10-02", start: "06:00" }), dia({ start: "09:00", end: "12:00" })],
      "day"
    );
    expect(r).toEqual({ valor: "09:00–12:00" });
  });

  it("Semana/Mes: total trabalhado e quantos dias", () => {
    const r = resumoDoExpediente(
      [dia({ workedMinutes: 480 }), dia({ date: "2026-10-04", workedMinutes: 75 }), dia({ start: null, workedMinutes: 0 })],
      "week"
    );
    expect(r).toEqual({ valor: "9h15", detalhe: "em 2 dias" });
  });

  it("Semana/Mes: um dia so, horas cheias", () => {
    expect(resumoDoExpediente([dia({ workedMinutes: 120 })], "month")).toEqual({
      valor: "2h00",
      detalhe: "em 1 dia",
    });
  });

  it("Semana/Mes: menos de uma hora", () => {
    expect(resumoDoExpediente([dia({ workedMinutes: 45 })], "month")).toEqual({
      valor: "45 min",
      detalhe: "em 1 dia",
    });
  });
});
