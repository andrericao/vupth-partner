import fs from "fs";
import path from "path";

// GUARDA DA MARCA (branch design/marca-dev, 2026-08-12).
//
// Os dois arquivos de tema trazem, cada um, um comentario dizendo que os tokens
// "precisam bater 1:1". Comentario nao quebra build — este teste quebra.
//
// Por que importa: durante a migracao, telas v1 (gluestack, props $token) e v2
// (NativeWind, className) convivem NA MESMA navegacao. Se as duas tabelas
// divergirem, o app mostra DOIS TONS da mesma cor e ninguem descobre por
// typecheck — foi exatamente a armadilha que ja custou retrabalho em 2026-07-29
// (o tailwind nasceu no teal antigo enquanto o gluestack ja era verde marca).

const ROOT = path.resolve(__dirname, "../../..");

// tailwind e CJS puro: da p/ exigir de verdade.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tailwind = require(path.join(ROOT, "tailwind.config.js"));
const gluestackSource = fs.readFileSync(
  path.join(ROOT, "config/gluestack-ui.config.ts"),
  "utf8"
);

/** Le `nome: '#HEX'` do arquivo do gluestack (fonte da verdade do v1). */
function gluestackToken(name: string): string | null {
  const m = gluestackSource.match(new RegExp(`\\b${name}:\\s*'(#[0-9A-Fa-f]{3,8})'`));
  return m ? m[1].toUpperCase() : null;
}

// tailwind `vupth.<chave>` -> gluestack `<token>`. Os nomes diferem de
// proposito (o gluestack precisa de prefixo p/ nao colidir na raiz), entao o
// mapa e explicito: se alguem renomear de um lado so, o teste acusa.
const PARES: [keyof typeof vupth, string][] = [
  ["green", "brandGreen"],
  ["forest", "forest"],
  ["forestSoft", "forestSoft"],
  ["greenTint", "greenTint"],
  ["accentBlue", "accentBlue"],
  ["accentPeach", "accentPeach"],
  ["accentPink", "accentPink"],
  ["accentPlum", "accentPlum"],
  ["background", "brandBackground"],
  ["surface", "brandSurface"],
  ["surfaceAlt", "brandSurfaceAlt"],
  ["textPrimary", "brandTextPrimary"],
  ["textSecondary", "brandTextSecondary"],
  ["border", "brandBorder"],
  ["danger", "brandDanger"],
  ["dangerTint", "brandDangerTint"],
  ["warning", "brandWarning"],
  ["success", "brandSuccess"],
];

const vupth: Record<string, string> = tailwind.theme.extend.colors.vupth;

describe("tokens da marca — tailwind x gluestack tem de bater 1:1", () => {
  it.each(PARES)("vupth.%s == %s do gluestack", (tw, gs) => {
    const esperado = vupth[tw as string]?.toUpperCase();
    expect(esperado).toBeDefined();
    expect(gluestackToken(gs)).toBe(esperado);
  });

  it("nenhum token da marca ficou so de um lado", () => {
    const noTailwind = Object.keys(vupth).sort();
    const mapeados = PARES.map(([tw]) => tw as string).sort();
    // Token novo no tailwind sem par no gluestack = "dois tons" esperando
    // acontecer; o teste obriga a atualizar os dois no MESMO commit.
    expect(noTailwind).toEqual(mapeados);
  });
});

describe("regra de contraste da marca — brandGreen so como FUNDO", () => {
  // A propria doc da marca (e os comentarios nos dois configs) diz: o verde
  // #9FE870 e claro demais p/ texto/icone sobre fundo claro; ele entra como
  // FUNDO, com `forest` por cima. Aqui travamos isso no codigo das primitivas.
  const nwButton = fs.readFileSync(
    path.join(ROOT, "src/components/nw/Button.tsx"),
    "utf8"
  );
  const labelMap = nwButton.slice(nwButton.indexOf("const LABEL"));

  it("nenhum variant usa vupth-green como cor de TEXTO", () => {
    expect(labelMap).not.toContain("text-vupth-green");
  });

  it("nenhum variant usa vupth-greenTint como cor de TEXTO", () => {
    expect(labelMap).not.toContain("text-vupth-greenTint");
  });
});

describe("fontes declaradas x fontes CARREGADAS", () => {
  // Fonte declarada no tailwind mas nao carregada no _layout nao quebra nada:
  // o RN cai na fonte do sistema e a tela fica "quase certa". E o tipo de
  // defeito que passa por revisao de codigo e so aparece no device.
  const layout = fs.readFileSync(path.join(ROOT, "app/_layout.tsx"), "utf8");
  const familias: string[] = Object.values(
    tailwind.theme.extend.fontFamily as Record<string, string[]>
  ).map((f) => f[0]);

  it.each(familias)("%s esta carregada no _layout", (fonte) => {
    expect(layout).toContain(fonte);
  });
});
