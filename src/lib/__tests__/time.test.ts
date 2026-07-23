import { maskTime, isValidTime, parseApiTime, toApiTime, deviceOffsetSuffix, isoDate, periodRange } from "../time";

describe("isoDate", () => {
  it("formata como YYYY-MM-DD com zero-pad", () => {
    expect(isoDate(new Date(2026, 5, 7))).toBe("2026-06-07");
    expect(isoDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("periodRange", () => {
  it("day: dateFrom === dateTo (hoje)", () => {
    const r = periodRange("day");
    expect(r.dateFrom).toBe(r.dateTo);
  });
  it("week e month: dateFrom <= dateTo", () => {
    expect(periodRange("week").dateFrom <= periodRange("week").dateTo).toBe(true);
    expect(periodRange("month").dateFrom <= periodRange("month").dateTo).toBe(true);
  });
});

describe("maskTime", () => {
  it("formats digits as HH:MM", () => {
    expect(maskTime("0900")).toBe("09:00");
    expect(maskTime("9")).toBe("9");
    expect(maskTime("09")).toBe("09");
    expect(maskTime("093")).toBe("09:3");
  });

  it("strips non-digits and caps at 4 digits", () => {
    expect(maskTime("09:00")).toBe("09:00");
    expect(maskTime("090000")).toBe("09:00");
    expect(maskTime("ab12cd34ef")).toBe("12:34");
  });
});

describe("isValidTime", () => {
  it("accepts valid HH:MM", () => {
    expect(isValidTime("00:00")).toBe(true);
    expect(isValidTime("09:00")).toBe(true);
    expect(isValidTime("23:59")).toBe(true);
  });

  it("rejects out-of-range or malformed", () => {
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("09:60")).toBe(false);
    expect(isValidTime("9:00")).toBe(false);
    expect(isValidTime("0900")).toBe(false);
    expect(isValidTime("")).toBe(false);
  });
});

describe("parseApiTime", () => {
  it("parses HH:mmZ (seconds omitted)", () => {
    expect(parseApiTime("09:00Z")).toBe("09:00");
    expect(parseApiTime("11:30Z")).toBe("11:30");
  });

  it("parses HH:mm:ssZ (seconds present)", () => {
    expect(parseApiTime("09:00:00Z")).toBe("09:00");
    expect(parseApiTime("18:05:00Z")).toBe("18:05");
  });

  it("parses offsets other than Z", () => {
    expect(parseApiTime("09:00-03:00")).toBe("09:00");
  });

  it("returns null for null/empty/garbage", () => {
    expect(parseApiTime(null)).toBeNull();
    expect(parseApiTime("")).toBeNull();
    expect(parseApiTime("nope")).toBeNull();
  });
});

// QA 2026-07-23 (bug do fuso): a hora digitada e LOCAL e precisa ir com o
// offset REAL do aparelho — rotular como "Z" deslocava a janela em -3h no
// Brasil (loja "aberta" as 6:30, cliente barrado as 18:30).
describe("deviceOffsetSuffix", () => {
  const withOffset = (min: number, fn: () => void) => {
    const spy = jest.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(min);
    try {
      fn();
    } finally {
      spy.mockRestore();
    }
  };

  it("Brasil (UTC-3, getTimezoneOffset=180) vira '-03:00'", () => {
    withOffset(180, () => expect(deviceOffsetSuffix()).toBe("-03:00"));
  });

  it("leste de Greenwich (ex.: UTC+5:30, offset=-330) vira '+05:30'", () => {
    withOffset(-330, () => expect(deviceOffsetSuffix()).toBe("+05:30"));
  });

  it("UTC exato vira 'Z'", () => {
    withOffset(0, () => expect(deviceOffsetSuffix()).toBe("Z"));
  });
});

describe("toApiTime", () => {
  it("monta OffsetTime com o offset do aparelho (nao mais 'Z' fixo)", () => {
    const spy = jest.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(180);
    try {
      expect(toApiTime("09:00")).toBe("09:00:00-03:00");
      expect(toApiTime("18:30")).toBe("18:30:00-03:00");
    } finally {
      spy.mockRestore();
    }
  });

  it("returns null for invalid input", () => {
    expect(toApiTime("24:00")).toBeNull();
    expect(toApiTime("9:00")).toBeNull();
    expect(toApiTime("")).toBeNull();
  });
});
