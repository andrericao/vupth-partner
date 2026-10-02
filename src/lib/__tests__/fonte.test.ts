import { PASSOS_DA_FONTE, passoValido, rotuloDoPasso, varsDaFonte, ESCALA_DE_TEXTO } from "@lib/fonte";

// "Tamanho da letra" (Andre, 26/09) — o mesmo do Client (2cb42320): Normal, +1,
// +2, +3, +4. Cada tamanho de texto soma o passo em px (10 → 11 → 12 → 13 →
// 14), com a altura de linha junto. So a letra muda; espacos e icones nao.
describe("fonte", () => {
  it("os passos e os rotulos do Client", () => {
    expect(PASSOS_DA_FONTE).toEqual([0, 1, 2, 3, 4]);
    expect(rotuloDoPasso(0)).toBe("Normal");
    expect(rotuloDoPasso(3)).toBe("+3");
  });

  it("passo invalido volta a Normal", () => {
    expect(passoValido("2")).toBe(2);
    expect(passoValido(9)).toBe(0);
    expect(passoValido(null)).toBe(0);
    expect(passoValido("abc")).toBe(0);
  });

  it("no Normal as variaveis sao os tamanhos da escala", () => {
    const v = varsDaFonte(0);
    expect(v["--text-xs"]).toBe("12px");
    expect(v["--lh-xs"]).toBe("16px");
    expect(v["--text-xxl"]).toBe("28px");
    expect(v["--f13"]).toBe("13px");
  });

  it("+2 soma 2 px em cada tamanho e em cada altura de linha", () => {
    const v = varsDaFonte(2);
    expect(v["--text-xs"]).toBe("14px");
    expect(v["--lh-xs"]).toBe("18px");
    expect(v["--text-sm"]).toBe("16px");
    expect(v["--f10"]).toBe("12px");
  });

  it("toda entrada da escala tem as duas variaveis", () => {
    const v = varsDaFonte(1);
    for (const nome of Object.keys(ESCALA_DE_TEXTO)) {
      expect(v[`--text-${nome}`]).toBeDefined();
      expect(v[`--lh-${nome}`]).toBeDefined();
    }
  });
});
