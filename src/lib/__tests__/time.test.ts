import { maskTime, isValidTime, parseApiTime, toApiTime } from "../time";

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

describe("toApiTime", () => {
  it("builds OffsetTime UTC from HH:MM", () => {
    expect(toApiTime("09:00")).toBe("09:00:00Z");
    expect(toApiTime("18:30")).toBe("18:30:00Z");
  });

  it("returns null for invalid input", () => {
    expect(toApiTime("24:00")).toBeNull();
    expect(toApiTime("9:00")).toBeNull();
    expect(toApiTime("")).toBeNull();
  });
});
