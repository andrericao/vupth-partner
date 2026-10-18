import { TETO_DE_LOJAS, ehTetoDeLojas, podeAdicionarLoja } from "@lib/multiLoja";

describe("multiLoja", () => {
  it("o teto e de 5 lojas por dono", () => {
    expect(TETO_DE_LOJAS).toBe(5);
    expect(podeAdicionarLoja(4)).toBe(true);
    expect(podeAdicionarLoja(5)).toBe(false);
  });

  it("reconhece o 409 OWNER_STORE_LIMIT", () => {
    expect(ehTetoDeLojas({ response: { data: { code: "OWNER_STORE_LIMIT" } } })).toBe(true);
    expect(ehTetoDeLojas({ response: { data: { code: "OUTRO" } } })).toBe(false);
    expect(ehTetoDeLojas(null)).toBe(false);
  });
});
