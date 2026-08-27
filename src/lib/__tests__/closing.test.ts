import {
  isClosingPromptEvent,
  graceSecondsRemaining,
  graceCountdownLabel,
} from "../closing";

describe("isClosingPromptEvent", () => {
  it("true só para CLOSING_PROMPT", () => {
    expect(isClosingPromptEvent("CLOSING_PROMPT")).toBe(true);
  });
  it("false para outros eventos / nulo", () => {
    expect(isClosingPromptEvent("QUEUE_CLOSING")).toBe(false);
    expect(isClosingPromptEvent("CUT_REQUESTED")).toBe(false);
    expect(isClosingPromptEvent(null)).toBe(false);
    expect(isClosingPromptEvent(undefined)).toBe(false);
  });
});

describe("graceSecondsRemaining", () => {
  const now = Date.parse("2026-07-25T20:00:00-03:00");

  it("segundos ate o fim da carencia (arredonda p/ cima)", () => {
    const end = "2026-07-25T20:14:30-03:00"; // 14min30s a frente
    expect(graceSecondsRemaining(end, now)).toBe(870);
  });

  it("0 quando já passou", () => {
    expect(graceSecondsRemaining("2026-07-25T19:59:00-03:00", now)).toBe(0);
  });

  it("0 para data inválida ou ausente", () => {
    expect(graceSecondsRemaining("nao-e-data", now)).toBe(0);
    expect(graceSecondsRemaining(null, now)).toBe(0);
    expect(graceSecondsRemaining(undefined, now)).toBe(0);
  });
});

describe("graceCountdownLabel", () => {
  it("formata M:SS", () => {
    expect(graceCountdownLabel(900)).toBe("15:00");
    expect(graceCountdownLabel(870)).toBe("14:30");
    expect(graceCountdownLabel(59)).toBe("0:59");
    expect(graceCountdownLabel(5)).toBe("0:05");
  });
  it("nunca negativo", () => {
    expect(graceCountdownLabel(0)).toBe("0:00");
    expect(graceCountdownLabel(-10)).toBe("0:00");
  });
});
