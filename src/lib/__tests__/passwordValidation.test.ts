import { validatePassword, getPasswordRules, senhaNoTamanho, SENHA_DICA } from "../passwordValidation";

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

  // DEC-79: de 6 a 64 caracteres.
  it("rejects when shorter than 6 chars", () => {
    const r = validatePassword("Ab1!");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("De 6 a 64 caracteres");
  });

  it("accepts 6 chars and 64 chars, rejects 65", () => {
    expect(validatePassword("Ab1!cd").valid).toBe(true);
    expect(validatePassword("Ab1!" + "x".repeat(60)).valid).toBe(true);
    const r = validatePassword("Ab1!" + "x".repeat(61));
    expect(r.valid).toBe(false);
    expect(r.errors).toContain(SENHA_DICA);
  });

  it("senhaNoTamanho", () => {
    expect(senhaNoTamanho("12345")).toBe(false);
    expect(senhaNoTamanho("123456")).toBe(true);
    expect(senhaNoTamanho("x".repeat(64))).toBe(true);
    expect(senhaNoTamanho("x".repeat(65))).toBe(false);
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
