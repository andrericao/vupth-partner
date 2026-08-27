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

// Razao de contraste WCAG entre dois hex.
function luminancia(hex: string): number {
  const c = hex.replace("#", "");
  const canal = (i: number) => {
    const v = parseInt(c.slice(i * 2, i * 2 + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
}
function razao(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

describe("contraste de cada variante do botao", () => {
  // ⚠️ Esta guarda JA FOI uma proibicao literal: "nenhum variant usa
  // text-vupth-green". A intencao estava certa — #9FE870 sobre claro da ~1.7:1
  // — mas a forma estava errada, e ela reprovou o `Button/Secondary` do proprio
  // arquivo de design, que e brand-green SOBRE FOREST e da 9.4:1.
  //
  // Proibir a cor e proibir o simbolo; o que importa e o PAR. Agora o teste le
  // o fundo e o rotulo de cada variante e mede — pega o caso ruim sem vetar o
  // bom, e nao precisa de emenda cada vez que uma variante nova aparece.
  const nwButton = fs.readFileSync(
    path.join(ROOT, "src/components/nw/Button.tsx"),
    "utf8"
  );
  const bloco = (nome: string) => {
    const i = nwButton.indexOf(`const ${nome}`);
    return nwButton.slice(i, nwButton.indexOf("};", i));
  };
  const BOX = bloco("BOX");
  const LABEL = bloco("LABEL");

  // `bg-vupth-x` / `text-vupth-x` -> hex; `text-white` -> #FFFFFF.
  const hexDe = (classe: string | undefined): string | null => {
    if (!classe) return null;
    if (classe === "white") return "#FFFFFF";
    return vupth[classe] ?? null;
  };
  const capturar = (fonte: string, variante: string, prefixo: string) => {
    const linha = fonte.match(new RegExp(`\\b${variante}:\\s*"([^"]*)"`));
    if (!linha) return null;
    const m = linha[1].match(new RegExp(`(?:^|\\s)${prefixo}-(?:vupth-)?([A-Za-z]+)`));
    return m ? m[1] : null;
  };

  const VARIANTES = [
    "primary",
    "secondary",
    "danger",
    "outlineBrand",
    "outlineDanger",
    "vupthPrimary",
    "vupthSecondary",
    "vupthOutline",
  ];

  it.each(VARIANTES)("%s passa no minimo AA (4.5:1)", (v) => {
    const fundo = hexDe(capturar(BOX, v, "bg") ?? undefined);
    const texto = hexDe(capturar(LABEL, v, "text") ?? undefined);
    // Variante transparente (outline/ghost) herda o fundo da tela — nao da p/
    // medir aqui; o fundo real e coberto pela varredura de telas.
    if (!fundo || !texto) return;
    expect(razao(fundo, texto)).toBeGreaterThanOrEqual(4.5);
  });

  it("brand-green como TEXTO so aparece sobre fundo escuro", () => {
    for (const v of VARIANTES) {
      if (capturar(LABEL, v, "text") !== "green") continue;
      const fundo = hexDe(capturar(BOX, v, "bg") ?? undefined);
      expect(fundo).toBeTruthy();
      expect(razao(fundo as string, vupth.green)).toBeGreaterThanOrEqual(4.5);
    }
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

// DS5 (QA de device): "as abas do rodape nao mostram qual esta ativa".
// A causa nao era o desenho — era a implementacao pela metade. O desenho
// especifica COR + PILULA `green-tint`; o codigo entregue fazia so a cor.
// E cor sozinha nao separa: ativo #163300 contra inativo #454745 da 1,49:1 UM
// CONTRA O OUTRO. Os dois se leem sobre o branco; entre si, nao.
describe("tab bar — o estado ativo nao pode depender so da cor", () => {
  const FORESTE = "#163300";
  const SECUNDARIO = "#454745";

  function contraste(a: string, b: string) {
    const lum = (h: string) => {
      const c = [1, 3, 5]
        .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const [claro, escuro] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (claro + 0.05) / (escuro + 0.05);
  }

  it("os dois tons sao indistinguiveis entre si — por isso a pilula existe", () => {
    expect(contraste(FORESTE, SECUNDARIO)).toBeLessThan(3);
  });

  it("a pilula esta implementada no TabBarIcon", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path");
    const fonte = fs.readFileSync(
      path.resolve(__dirname, "../../components/TabBarIcon.tsx"),
      "utf8"
    );
    expect(fonte).toMatch(/bg-vupth-greenTint/);
  });
});
