import {
  isMealDue,
  mealSignal,
  hhmmToMinutes,
  MEAL_LEAD_MIN,
  MEAL_NUDGE_WINDOW_MIN,
} from "../meals";

const at = (hhmm: string) => hhmmToMinutes(hhmm);
const meal = (fixedStartTime: string | null, status = "SCHEDULED") => ({ status, fixedStartTime });

// mealSignal le fixedStartTime via parseApiTime, que converte o OffsetTime p/ o
// RELOGIO LOCAL do aparelho. Fixamos o offset em UTC p/ que "12:00Z" == 12:00
// local, deixando as assercoes independentes do fuso de quem roda o CI/pre-push.
let tzSpy: jest.SpyInstance;
beforeAll(() => {
  tzSpy = jest.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(0);
});
afterAll(() => tzSpy.mockRestore());

describe("hhmmToMinutes", () => {
  it("converte HH:MM em minutos", () => {
    expect(hhmmToMinutes("00:00")).toBe(0);
    expect(hhmmToMinutes("12:30")).toBe(750);
    expect(hhmmToMinutes("23:59")).toBe(1439);
  });
});

describe("mealSignal", () => {
  const almoco = [meal("12:00Z")];

  it("null quando não há refeição", () => {
    expect(mealSignal([], at("12:00"))).toBeNull();
  });

  it("null muito antes (fora da antecedencia)", () => {
    expect(mealSignal(almoco, at("11:29"))).toBeNull();
  });

  // Andre 2026-07-20: aparecer 30min ANTES, com contagem, para dar tempo de decidir.
  it("'proxima' a partir de 30min antes, com os minutos restantes", () => {
    expect(mealSignal(almoco, at("11:30"))).toEqual({ phase: "proxima", minutesUntil: 30 });
    expect(mealSignal(almoco, at("11:45"))).toEqual({ phase: "proxima", minutesUntil: 15 });
    expect(mealSignal(almoco, at("11:59"))).toEqual({ phase: "proxima", minutesUntil: 1 });
  });

  it("'agora' no horário exato e dentro da janela", () => {
    expect(mealSignal(almoco, at("12:00"))).toEqual({ phase: "agora", minutesUntil: 0 });
    expect(mealSignal(almoco, at("12:30"))).toEqual({ phase: "agora", minutesUntil: -30 });
  });

  it("'agora' no limite da janela e null depois", () => {
    const limite = at("12:00") + MEAL_NUDGE_WINDOW_MIN;
    expect(mealSignal(almoco, limite)?.phase).toBe("agora");
    expect(mealSignal(almoco, limite + 1)).toBeNull();
  });

  it("ignora refeição que não está SCHEDULED (já ativa não e pendência)", () => {
    expect(mealSignal([meal("12:00Z", "ACTIVE")], at("12:10"))).toBeNull();
    expect(mealSignal([meal("12:00Z", "ACTIVE")], at("11:40"))).toBeNull();
  });

  it("ignora horário ausente ou inválido", () => {
    expect(mealSignal([meal(null)], at("12:10"))).toBeNull();
    expect(mealSignal([meal("banana")], at("12:10"))).toBeNull();
  });

  it("'agora' tem prioridade sobre 'proxima'", () => {
    // almoco ja passou (agora) e janta se aproxima (proxima) -> agora vence
    expect(mealSignal([meal("18:00Z"), meal("12:20Z")], at("12:30"))?.phase).toBe("agora");
  });

  it("havendo duas 'proxima', vence a mais perto", () => {
    expect(mealSignal([meal("12:20Z"), meal("12:05Z")], at("12:00"))).toEqual({
      phase: "proxima",
      minutesUntil: 5,
    });
  });

  it("aceita antecedencia e janela customizadas", () => {
    expect(mealSignal(almoco, at("11:50"), 5)).toBeNull();
    expect(mealSignal(almoco, at("11:57"), 5)?.phase).toBe("proxima");
    expect(mealSignal(almoco, at("12:10"), MEAL_LEAD_MIN, 5)).toBeNull();
  });
});

describe("isMealDue", () => {
  it("true tanto na antecedencia quanto depois do horário", () => {
    expect(isMealDue([meal("12:00Z")], at("11:40"))).toBe(true);
    expect(isMealDue([meal("12:00Z")], at("12:10"))).toBe(true);
  });

  it("false fora de qualquer janela", () => {
    expect(isMealDue([meal("12:00Z")], at("10:00"))).toBe(false);
    expect(isMealDue([], at("12:00"))).toBe(false);
  });
});
