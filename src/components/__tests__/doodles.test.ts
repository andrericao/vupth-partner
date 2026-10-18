import { DOODLES, DOODLE_INK, type DoodleName } from "@components/doodles";
import { coresDoTema } from "@theme/tema";

// As classes `vupth-*` do tailwind leem variaveis (modo escuro, DEC-75); o hex de
// cada token NO TEMA CLARO, que e o que o <Svg> repete, vem do tokens.json.
const vupth: Record<string, string> = coresDoTema("claro");

// GUARDA DAS CORES DA ILUSTRACAO.
//
// Os doodles pintam com HEX, nao com classe: a cor entra como `fill` dentro de
// um <Svg>, onde o className do NativeWind nao chega. Hex escrito na mao e
// exatamente o jeito de a paleta divergir em silencio — foi assim que o
// `dangerTint` do gluestack se separou do tailwind e so o teste pegou.
//
// Aqui cada cor usada pela colecao e comparada com o token de onde ela veio.
const ESPERADO: Record<DoodleName, string> = {
  fila: vupth.accentBlue,
  tempo: vupth.accentPeach,
  local: vupth.greenTint,
  busca: vupth.accentPink,
};

describe("doodles falam a mesma paleta do tailwind", () => {
  it.each(Object.keys(ESPERADO) as DoodleName[])(
    "o acento de %s vem do token da marca",
    (nome) => {
      expect(DOODLES[nome].accent.toUpperCase()).toBe(ESPERADO[nome].toUpperCase());
    },
  );

  it("o traco e o forest da marca", () => {
    expect(DOODLE_INK.toUpperCase()).toBe(vupth.forest.toUpperCase());
  });

  it("todo doodle registrado tem arte e acento", () => {
    for (const [nome, reg] of Object.entries(DOODLES)) {
      expect(typeof reg.art).toBe("function");
      expect(reg.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(nome).toMatch(/^[a-z]+$/);
    }
  });
});
