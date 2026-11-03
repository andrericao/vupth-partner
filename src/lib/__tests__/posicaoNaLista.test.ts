import { paramsDaPosicao, posicaoValida } from "../posicaoNaLista";

describe("posicaoNaLista (DEC-176)", () => {
  it("aceita inteiro >= 1, vindo como numero ou texto da rota", () => {
    expect(posicaoValida(1)).toBe(1);
    expect(posicaoValida("3")).toBe(3);
  });

  it("recusa ausente, zero, negativo, fracao e texto solto", () => {
    for (const v of [undefined, null, "", "0", 0, -2, "1.5", "abc", NaN]) {
      expect(posicaoValida(v)).toBeNull();
    }
  });

  it("so monta o param quando a loja veio da lista", () => {
    expect(paramsDaPosicao("2")).toEqual({ list_position: 2 });
    expect(paramsDaPosicao(undefined)).toBeUndefined();
  });
});
