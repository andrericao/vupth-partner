import { DOODLES, DOODLE_INK, type DoodleName } from "@components/doodles";
import { coresDoTema } from "@theme/tema";

// O registro guarda o NOME da cor do tema (o <Doodle> a resolve com useTema); o
// hex de cada um NO TEMA CLARO, que e o que o <Svg> pintava antes do escuro,
// vem do tokens.json por tema.ts.
const claro: Record<string, string> = coresDoTema("claro");
const escuro: Record<string, string> = coresDoTema("escuro");

// GUARDA DAS CORES DA ILUSTRACAO.
//
// Os doodles pintam com HEX, nao com classe: a cor entra como `fill` dentro de
// um <Svg>, onde o className do NativeWind nao chega. Hex escrito na mao e
// exatamente o jeito de a paleta divergir em silencio — foi assim que o
// `dangerTint` do gluestack se separou do tailwind e so o teste pegou.
//
// Aqui cada cor usada pela colecao e comparada com o token de onde ela veio.
const ESPERADO: Record<DoodleName, string> = {
  fila: "accentBlue",
  tempo: "accentPeach",
  local: "greenTint",
  busca: "accentPink",
};

// Os hex de antes do escuro: no claro nada muda.
const HEX_DE_ANTES: Record<DoodleName, string> = {
  fila: "#A0E1E1",
  tempo: "#FFC091",
  local: "#E2F6D5",
  busca: "#FFD7EF",
};

describe("doodles falam a mesma paleta do tailwind", () => {
  it.each(Object.keys(ESPERADO) as DoodleName[])(
    "o acento de %s vem do token da marca",
    (nome) => {
      expect(DOODLES[nome].accent).toBe(ESPERADO[nome]);
      expect(claro[DOODLES[nome].accent].toUpperCase()).toBe(HEX_DE_ANTES[nome]);
    },
  );

  it("o traco e o forest da marca no claro, e claro sobre escuro no escuro", () => {
    expect(claro[DOODLE_INK].toUpperCase()).toBe(claro.forest.toUpperCase());
    expect(escuro[DOODLE_INK]).toBe(escuro.textPrimary);
  });

  it("no escuro o acento e escuro e o traco e claro: o desenho nao some", () => {
    for (const nome of Object.keys(ESPERADO) as DoodleName[]) {
      const acento = escuro[DOODLES[nome].accent];
      const traco = escuro[DOODLE_INK];
      expect(luminancia(traco)).toBeGreaterThan(luminancia(acento) * 4);
    }
  });

  it("todo doodle registrado tem arte e acento", () => {
    for (const [nome, reg] of Object.entries(DOODLES)) {
      expect(typeof reg.art).toBe("function");
      expect(Object.keys(claro)).toContain(reg.accent);
      expect(nome).toMatch(/^[a-z]+$/);
    }
  });
});

function luminancia(hex: string): number {
  const canal = (i: number) => {
    const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
}
