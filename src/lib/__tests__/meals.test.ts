import { isMealDue, hhmmToMinutes, MEAL_NUDGE_WINDOW_MIN } from "../meals";

const at = (hhmm: string) => hhmmToMinutes(hhmm);
const meal = (fixedStartTime: string | null, status = "SCHEDULED") => ({ status, fixedStartTime });

describe("hhmmToMinutes", () => {
  it("converte HH:MM em minutos", () => {
    expect(hhmmToMinutes("00:00")).toBe(0);
    expect(hhmmToMinutes("12:30")).toBe(750);
    expect(hhmmToMinutes("23:59")).toBe(1439);
  });
});

describe("isMealDue", () => {
  it("false quando nao ha refeicao", () => {
    expect(isMealDue([], at("12:00"))).toBe(false);
  });

  it("false antes do horario", () => {
    expect(isMealDue([meal("12:00Z")], at("11:59"))).toBe(false);
  });

  it("true no horario exato", () => {
    expect(isMealDue([meal("12:00Z")], at("12:00"))).toBe(true);
  });

  it("true dentro da janela", () => {
    expect(isMealDue([meal("12:00Z")], at("12:30"))).toBe(true);
  });

  it("true no limite da janela e false depois", () => {
    const limite = at("12:00") + MEAL_NUDGE_WINDOW_MIN;
    expect(isMealDue([meal("12:00Z")], limite)).toBe(true);
    expect(isMealDue([meal("12:00Z")], limite + 1)).toBe(false);
  });

  it("ignora refeicao que nao esta SCHEDULED (ja ativa nao e pendencia)", () => {
    expect(isMealDue([meal("12:00Z", "ACTIVE")], at("12:10"))).toBe(false);
  });

  it("ignora horario ausente ou invalido", () => {
    expect(isMealDue([meal(null)], at("12:10"))).toBe(false);
    expect(isMealDue([meal("banana")], at("12:10"))).toBe(false);
  });

  it("basta UMA refeicao na janela", () => {
    expect(isMealDue([meal("08:00Z"), meal("12:00Z")], at("12:05"))).toBe(true);
  });

  it("aceita janela customizada", () => {
    expect(isMealDue([meal("12:00Z")], at("12:10"), 5)).toBe(false);
  });
});
