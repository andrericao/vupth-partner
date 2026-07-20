import {
  isMealDue,
  mealPhase,
  hhmmToMinutes,
  MEAL_LEAD_MIN,
  MEAL_NUDGE_WINDOW_MIN,
} from "../meals";

const at = (hhmm: string) => hhmmToMinutes(hhmm);
const meal = (fixedStartTime: string | null, status = "SCHEDULED") => ({ status, fixedStartTime });

describe("hhmmToMinutes", () => {
  it("converte HH:MM em minutos", () => {
    expect(hhmmToMinutes("00:00")).toBe(0);
    expect(hhmmToMinutes("12:30")).toBe(750);
    expect(hhmmToMinutes("23:59")).toBe(1439);
  });
});

describe("mealPhase", () => {
  const almoco = [meal("12:00Z")];

  it("null quando nao ha refeicao", () => {
    expect(mealPhase([], at("12:00"))).toBeNull();
  });

  it("null muito antes (fora da antecedencia)", () => {
    expect(mealPhase(almoco, at("11:29"))).toBeNull();
  });

  // Andre 2026-07-20: aparecer 30min ANTES para dar tempo de decidir.
  it("'proxima' a partir de 30min antes", () => {
    expect(mealPhase(almoco, at("11:30"))).toBe("proxima");
    expect(mealPhase(almoco, at("11:59"))).toBe("proxima");
  });

  it("'agora' no horario exato e dentro da janela", () => {
    expect(mealPhase(almoco, at("12:00"))).toBe("agora");
    expect(mealPhase(almoco, at("12:30"))).toBe("agora");
  });

  it("'agora' no limite da janela e null depois", () => {
    const limite = at("12:00") + MEAL_NUDGE_WINDOW_MIN;
    expect(mealPhase(almoco, limite)).toBe("agora");
    expect(mealPhase(almoco, limite + 1)).toBeNull();
  });

  it("ignora refeicao que nao esta SCHEDULED (ja ativa nao e pendencia)", () => {
    expect(mealPhase([meal("12:00Z", "ACTIVE")], at("12:10"))).toBeNull();
    expect(mealPhase([meal("12:00Z", "ACTIVE")], at("11:40"))).toBeNull();
  });

  it("ignora horario ausente ou invalido", () => {
    expect(mealPhase([meal(null)], at("12:10"))).toBeNull();
    expect(mealPhase([meal("banana")], at("12:10"))).toBeNull();
  });

  it("'agora' vence 'proxima' quando ha duas na janela", () => {
    // almoco ja passou (agora) e janta esta chegando (proxima) -> agora
    expect(mealPhase([meal("18:00Z"), meal("12:00Z")], at("17:40"))).toBe("proxima");
    expect(mealPhase([meal("18:00Z"), meal("12:20Z")], at("12:30"))).toBe("agora");
  });

  it("aceita antecedencia e janela customizadas", () => {
    expect(mealPhase(almoco, at("11:50"), 5)).toBeNull();
    expect(mealPhase(almoco, at("11:57"), 5)).toBe("proxima");
    expect(mealPhase(almoco, at("12:10"), MEAL_LEAD_MIN, 5)).toBeNull();
  });
});

describe("isMealDue", () => {
  it("true tanto na antecedencia quanto depois do horario", () => {
    expect(isMealDue([meal("12:00Z")], at("11:40"))).toBe(true);
    expect(isMealDue([meal("12:00Z")], at("12:10"))).toBe(true);
  });

  it("false fora de qualquer janela", () => {
    expect(isMealDue([meal("12:00Z")], at("10:00"))).toBe(false);
    expect(isMealDue([], at("12:00"))).toBe(false);
  });
});
