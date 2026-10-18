import fs from "fs";
import path from "path";

// GUARDA DA MARCA (2026-08-12; revista em 25/09 e em 18/10).
//
// Ate 25/09 este teste comparava o tailwind com o tema do Gluestack, porque
// telas das duas geracoes conviviam na mesma navegacao e dois tons da mesma
// cor apareciam sem ninguem perceber. A migracao terminou e o Gluestack saiu;
// agora a tabela abaixo prende os tokens aos VALORES DO ARQUIVO DE DESIGN
// (Pencil, tokens `brand*`), os mesmos do app do client. Mudou um hex? Mude
// aqui junto — de proposito, para a troca ser uma decisao e nao um acidente.
//
// Modo escuro (18/10, DEC-75): as cores do tailwind deixaram de ser hex e
// viraram `rgb(var(--vupth-x) / <alpha-value>)`. A tabela continua sendo a do
// TEMA CLARO e a asserção ficou mais forte: segue a cadeia inteira — a classe
// do tailwind, a variavel que ela le e o valor que essa variavel tem no claro —
// e exige o hex do desenho. O escuro e medido em src/theme/__tests__/tema.test.ts.

import { coresDoTema, varsDoTema } from "../../theme/tema";

const ROOT = path.resolve(__dirname, "../../..");

// tailwind e CJS puro: da p/ exigir de verdade.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tailwind = require(path.join(ROOT, "tailwind.config.js"));

const DESENHO: Record<string, string> = {
  green: "#9FE870",
  forest: "#163300",
  forestSoft: "#223D0D",
  greenTint: "#E2F6D5",
  accentBlue: "#A0E1E1",
  accentPeach: "#FFC091",
  accentPink: "#FFD7EF",
  accentPlum: "#260A2F",
  background: "#FFFFFF",
  surface: "#F3F5F1",
  surfaceAlt: "#E2F6D5",
  textPrimary: "#163300",
  textSecondary: "#454745",
  textPlaceholder: "#6B706B",
  border: "#D7DDD3",
  danger: "#B3261E",
  dangerTint: "#F7E4E2",
  warning: "#FFC091",
  success: "#9FE870",
  // Pares on* e amber que o tokens.json (17/10) acrescentou. No claro cada
  // texto sobre bloco colorido e forest, e o on-danger e branco.
  onGreen: "#163300",
  onGreenTint: "#163300",
  onDanger: "#FFFFFF",
  onAccentPeach: "#163300",
  onAccentBlue: "#163300",
  onAccentPink: "#163300",
  onAccentPlum: "#F3F5F1",
  amber: "#FFB703",
  // Papeis (src/theme/papeis.json): no claro cada um e o token que a tela ja
  // usava antes do escuro — painel de modal branco, bloco sobre o painel
  // surface, opcao marcada forest com texto green.
  painel: "#FFFFFF",
  sobrePainel: "#F3F5F1",
  selecionado: "#163300",
  onSelecionado: "#9FE870",
  onSelecionadoBranco: "#FFFFFF", // era text-white sobre o chip forest
  pessego: "#FFC091", // o ponto e o texto pessego (era warning usado como cor)
  esqueleto: "#D7DDD3", // o bloco do esqueleto (era border)
  trilho: "#D7DDD3", // o trilho vazio da barra de progresso (era border fixo)
  progressoSuave: "#E2F6D5", // a barra do perfil (era greenTint fixo)
};

const noTailwind: Record<string, string> = tailwind.theme.extend.colors.vupth;

// "159 232 112" -> "#9FE870"
const hexDosCanais = (canais: string) =>
  "#" +
  canais
    .split(" ")
    .map((n) => Number(n).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

// O hex que cada classe `vupth-*` tem no tema claro: classe do tailwind ->
// variavel que ela le -> valor da variavel no claro.
const vupth: Record<string, string> = Object.fromEntries(
  Object.entries(noTailwind).map(([nome, valor]) => {
    const variavel = /^rgb\(var\((--vupth-[a-z-]+)\) \/ <alpha-value>\)$/.exec(valor)?.[1];
    return [nome, variavel ? hexDosCanais(varsDoTema("claro")[variavel]) : valor];
  }),
);

describe("tokens da marca — os valores do arquivo de design", () => {
  it.each(Object.entries(DESENHO))("vupth.%s == %s", (token, hex) => {
    expect(vupth[token]?.toUpperCase()).toBe(hex);
  });

  it("o tema claro de tema.ts e a mesma tabela (nada muda para quem nao escolhe o escuro)", () => {
    expect(coresDoTema("claro")).toEqual(
      Object.fromEntries(Object.entries(DESENHO).map(([k, v]) => [k, v.toUpperCase()])),
    );
  });

  it("nenhum token novo sem passar por aqui", () => {
    expect(Object.keys(vupth).sort()).toEqual(Object.keys(DESENHO).sort());
  });

  it("o tema do Gluestack nao volta (a migracao terminou em 25/09)", () => {
    expect(fs.existsSync(path.join(ROOT, "config/gluestack-ui.config.ts"))).toBe(false);
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

describe("campo vazio nao pode parecer preenchido", () => {
  // 🔴 Andre, 14/09: "campos não ficam vazios em formulários".
  //
  // O placeholder era `textSecondary` (#454745) e o texto digitado e forest
  // (#163300): 1,49:1 ENTRE OS DOIS. E o MESMO numero do DS5.1, com o mesmo par
  // de cores — dois tons escuros que o olho nao separa. O campo vazio lia como
  // campo preenchido.
  //
  // ⚠️ O codigo estava FIEL ao arquivo de design: o especime do `Input Group`
  // desenha o placeholder em text-secondary. O defeito nasceu no desenho, nao
  // na implementacao — por isso a correcao e um TOKEN novo, e nao um hex solto
  // numa tela.
  const branco = "#FFFFFF";

  it("o placeholder se separa do texto digitado", () => {
    // 1,49:1 era o valor que falhou. O piso aqui e o dobro disso.
    expect(razao(vupth.textPlaceholder, vupth.textPrimary)).toBeGreaterThan(2.5);
  });

  it("e mesmo assim continua legivel — AA de texto normal", () => {
    expect(razao(vupth.textPlaceholder, branco)).toBeGreaterThanOrEqual(4.5);
  });

  it("nenhuma tela escreve a cor do placeholder na mao", () => {
    // Hex solto numa tela e como as duas tabelas divergiram da ultima vez.
    const telas = [
      "src/components/nw/Input.tsx",
      "src/components/InputSearch.tsx",
    ];
    for (const t of telas) {
      const src = fs.readFileSync(path.join(ROOT, t), "utf8");
      expect(src).not.toMatch(/placeholderTextColor="#454745"/);
    }
  });
});

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
    "secondaryPainel",
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

  it.each(VARIANTES)("%s passa no minimo AA tambem no tema ESCURO", (v) => {
    // No escuro o rotulo tem de vir de um token que TROCA de tema: um `forest`
    // ou `white` fixo daria forest sobre forest (1:1). O fundo transparente
    // (outline, ghost) assenta sobre a tela, o cartao ou o painel do modal: o
    // rotulo precisa passar nos tres.
    const escuro = coresDoTema("escuro") as Record<string, string>;
    const nome = (fonte: string, prefixo: string) => capturar(fonte, v, prefixo);
    const hex = (classe: string | null) => (classe === "white" ? "#FFFFFF" : classe ? escuro[classe] : undefined);
    const texto = hex(nome(LABEL, "text"));
    expect(texto).toBeTruthy();
    const fundoClasse = nome(BOX, "bg");
    const fundos =
      fundoClasse === "transparent"
        ? [escuro.background, escuro.surface, escuro.painel]
        : [hex(fundoClasse) as string];
    for (const fundo of fundos) expect(razao(fundo, texto as string)).toBeGreaterThanOrEqual(4.5);
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

describe("fontes — de ONDE elas sao carregadas (armadilha da Cloudflare Pages)", () => {
  // 🔴 DEFEITO REAL, 2026-08-27: o app publicado ficava num spinner eterno.
  //
  // A Cloudflare Pages **exclui `node_modules` do deploy, por design**. O
  // `expo export --platform web` grava os assets espelhando o caminho de
  // origem, entao as fontes saiam em `dist/assets/node_modules/@expo-google-
  // fonts/...` e a Pages descartava a pasta inteira, em silencio. Resultado:
  // `useFonts` baixava o index.html do fallback de SPA no lugar do TTF, nunca
  // resolvia, e o `_layout` segurava a tela para sempre.
  //
  // Nao da para testar o deploy daqui — da para travar as duas causas.
  const layout = fs.readFileSync(path.join(ROOT, "app/_layout.tsx"), "utf8");

  it("nenhuma fonte e IMPORTADA de @expo-google-fonts", () => {
    // E o caminho que a Pages apaga. Os arquivos vivem em assets/fonts/.
    //
    // Casa `from "@expo-google-fonts/..."`, e nao a string solta: o comentario
    // que explica esta regra no proprio `_layout.tsx` cita o pacote pelo nome,
    // e a 1a versao deste teste reprovava por causa dele. Guarda que proibe
    // ate falar do assunto empurra a explicacao para fora do codigo — que e o
    // oposto do que se quer.
    expect(layout).not.toMatch(/from\s+["']@expo-google-fonts/);
  });

  it("os TTFs existem no repositorio, fora de node_modules", () => {
    const familias: string[] = Object.values(
      tailwind.theme.extend.fontFamily as Record<string, string[]>
    ).map((f) => f[0]);

    for (const fonte of familias) {
      const ttf = path.join(ROOT, "assets/fonts", `${fonte}.ttf`);
      expect(fs.existsSync(ttf)).toBe(true);
    }
  });

  it("a tela nao fica refem do carregamento de fonte", () => {
    // `useFonts` devolve [loaded, error]. Segurando so no `loaded`, qualquer
    // falha de fonte vira spinner eterno — que foi exatamente o sintoma.
    // Com o erro no portao, o app abre com a fonte do sistema.
    expect(layout).toMatch(/fontLoaded\s*\|\|\s*fontError/);
  });
});
