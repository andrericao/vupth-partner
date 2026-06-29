import { validatePassword, getPasswordRules } from "../passwordValidation";

describe("getPasswordRules", () => {
  it("marks all rules passed for a strong password", () => {
    const rules = getPasswordRules("Abc12345!");
    expect(rules.every((r) => r.passed)).toBe(true);
    expect(rules).toHaveLength(4);
  });

  it("flags only the failing rules", () => {
    const rules = getPasswordRules("abcdefgh"); // sem numero e sem especial
    const failed = rules.filter((r) => !r.passed).map((r) => r.label);
    expect(failed).toContain("Pelo menos um número");
    expect(failed).toContain("Pelo menos um caractere especial");
    expect(failed).not.toContain("Pelo menos uma letra");
  });
});

describe("validatePassword", () => {
  it("accepts a strong password", () => {
    const r = validatePassword("Abc12345!");
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it("rejects when shorter than 8 chars", () => {
    const r = validatePassword("Ab1!");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Mínimo de 8 caracteres");
  });

  it("requires a letter", () => {
    const r = validatePassword("12345678!");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Pelo menos uma letra");
  });

  it("requires a number", () => {
    const r = validatePassword("abcdefg!");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Pelo menos um número");
  });

  it("requires a special character", () => {
    const r = validatePassword("abcd1234");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Pelo menos um caractere especial");
  });

  it("accumulates multiple errors", () => {
    const r = validatePassword("abc");
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(3);
  });
});
