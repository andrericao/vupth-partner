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

describe("avaliacao-no-resumo — normalizeProfessional", () => {
  // import tardio: o store puxa o SecureStore, que o jest ja mocka no setup
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { normalizeProfessional } = require("@store/professional.store");

  it("guarda a nota quando o /me a traz (snake ou camel) e nulo quando nao", () => {
    expect(normalizeProfessional({ id: "1", name: "A", rating_average: 4.5, rating_count: 8 })).toMatchObject({
      rating_average: 4.5,
      rating_count: 8,
    });
    expect(normalizeProfessional({ id: "1", name: "A", ratingAverage: 4, ratingCount: 2 })).toMatchObject({
      rating_average: 4,
      rating_count: 2,
    });
    expect(normalizeProfessional({ id: "1", name: "A" })).toMatchObject({
      rating_average: null,
      rating_count: null,
    });
  });
});
