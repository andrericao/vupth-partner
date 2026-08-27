import { ratingLabel } from "../rating";

describe("ratingLabel", () => {
  it("formata media com 1 casa + contagem", () => {
    expect(ratingLabel(4.75, 12)).toBe("4.8 (12)");
    expect(ratingLabel(5, 3)).toBe("5.0 (3)");
    expect(ratingLabel(4.2, 1)).toBe("4.2 (1)");
  });
  it("null quando não há avaliacoes (count 0)", () => {
    expect(ratingLabel(0, 0)).toBeNull();
    expect(ratingLabel(4.5, 0)).toBeNull();
  });
  it("null quando campos ausentes ou inválidos", () => {
    expect(ratingLabel(null, 5)).toBeNull();
    expect(ratingLabel(4.5, null)).toBeNull();
    expect(ratingLabel(undefined, undefined)).toBeNull();
    expect(ratingLabel(0, 5)).toBeNull();
  });
});
