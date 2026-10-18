import path from "path";
import tokens from "../tokens.json";
import { papeis } from "../papeis.json";
import {
  BRANCO,
  NOMES_DE_COR,
  NOMES_DE_PAPEL,
  NOMES_DE_TOKEN,
  PREFERENCIAS,
  ROTULO_DA_PREFERENCIA,
  canais,
  coresDoTema,
  interruptorDoTema,
  nomeDaVariavel,
  preferenciaValida,
  resolverTema,
  tokenDoPapel,
  varsDoTema,
  veuDoTema,
  type Cores,
  type NomeDeCor,
  type Tema,
} from "../tema";

// GUARDA DO TEMA (DEC-75, 16/10). Os valores vivem em src/theme/tokens.json,
// copia do pacote da Design (vupth-docs/fontes/design/tokens.json). Este teste
// nao tem tabela de hex: mede o JSON. Mudou uma cor la? Os pares de
// `verificacao` do proprio arquivo dizem se ainda passa.

const ROOT = path.resolve(__dirname, "../../..");
// tailwind e CJS puro: da p/ exigir de verdade.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tailwind = require(path.join(ROOT, "tailwind.config.js"));

function luminancia(hex: string): number {
  const canal = (i: number) => {
    const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
}
function razao(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
const TEMAS: Tema[] = ["claro", "escuro"];

describe("tokens.json — o pacote da Design", () => {
  it("toda cor tem claro e escuro em hex de 6 digitos", () => {
    for (const nome of NOMES_DE_TOKEN) {
      for (const tema of TEMAS) {
        expect(tokens.cor[nome][tema]).toMatch(/^#[0-9A-F]{6}$/i);
      }
    }
  });

  it("e a versao de 17/10 (trocar o arquivo e uma decisao, nao um acidente)", () => {
    expect(tokens.versao).toBe("2026-10-17");
  });
});

describe("contraste — reaplica os pares de `verificacao` do tokens.json", () => {
  // Texto: 4,5:1. Componente grafico (o V e o icone em verde): 3:1. O minimo
  // vem de cada par do proprio arquivo. A razao gravada nele e a que a Design
  // mediu; a nossa tem de bater (±0,02: arredondamento).
  it.each(tokens.verificacao.map((par) => [`${par.texto} sobre ${par.fundo} (${par.tema})`, par] as const))(
    "%s",
    (_nome, par) => {
      const cores = coresDoTema(par.tema as Tema);
      const medida = razao(cores[par.texto as NomeDeCor], cores[par.fundo as NomeDeCor]);
      expect(medida).toBeGreaterThanOrEqual(par.minimo);
      expect(Math.abs(medida - par.razao)).toBeLessThan(0.02);
    },
  );

  it("a lista cobre os dois temas e os pares de texto de cada token on*", () => {
    const temas = new Set(tokens.verificacao.map((p) => p.tema));
    expect(temas).toEqual(new Set(["claro", "escuro"]));
    for (const on of NOMES_DE_TOKEN.filter((n) => /^on[A-Z]/.test(n))) {
      expect(tokens.verificacao.some((p) => p.texto === on)).toBe(true);
    }
  });
});

describe("as tres regras do escuro (design.html#tokens-escuros)", () => {
  const c = tokens.cor;

  it("1. forest vira a surface", () => {
    expect(c.surface.escuro).toBe(c.forest.claro);
  });

  it("2. cada acento troca de papel: o hex claro passa a ser o TEXTO", () => {
    expect(c.onAccentPeach.escuro).toBe(c.accentPeach.claro);
    expect(c.onAccentBlue.escuro).toBe(c.accentBlue.claro);
    expect(c.onAccentPink.escuro).toBe(c.accentPink.claro);
    // ...e o fundo do bloco vira um escuro (a luminancia cai).
    for (const nome of ["accentPeach", "accentBlue", "accentPink"] as const) {
      expect(luminancia(c[nome].escuro)).toBeLessThan(luminancia(c[nome].claro) / 4);
    }
  });

  it("3. o botao primario NAO muda: green e onGreen valem o mesmo nos dois temas", () => {
    expect(c.green.escuro).toBe(c.green.claro);
    expect(c.onGreen.escuro).toBe(c.onGreen.claro);
  });

  it("texto nunca e forest: no escuro forest sobre surface daria 1:1", () => {
    expect(razao(c.forest.escuro, c.surface.escuro)).toBeCloseTo(1, 5);
    expect(razao(c.textPrimary.escuro, c.surface.escuro)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("papeis — onde o desenho troca de token entre os temas", () => {
  it("cada papel aponta para tokens que existem (nunca para um hex)", () => {
    for (const nome of NOMES_DE_PAPEL) {
      for (const tema of TEMAS) {
        expect(NOMES_DE_TOKEN).toContain(tokenDoPapel(nome, tema));
      }
    }
  });

  it("papel nao repete nome de token (a classe seria ambigua)", () => {
    for (const nome of NOMES_DE_PAPEL) expect(NOMES_DE_TOKEN).not.toContain(nome);
  });

  it("no CLARO cada papel e o token que a tela ja usava (nada muda no claro)", () => {
    expect(papeis.painel.claro).toBe("background"); // era bg-white
    expect(papeis.sobrePainel.claro).toBe("surface"); // era bg-vupth-surface
    expect(papeis.selecionado.claro).toBe("forest"); // era bg-vupth-forest
    expect(papeis.onSelecionado.claro).toBe("green"); // era text-vupth-green
    expect(papeis.onSelecionadoBranco.claro).toBe("background"); // era text-white
    expect(papeis.pessego.claro).toBe("accentPeach"); // era warning usado como cor
    expect(papeis.esqueleto.claro).toBe("border"); // era #D7DDD3 fixo
    expect(papeis.trilho.claro).toBe("border"); // o trilho da barra era #D7DDD3 fixo
    expect(papeis.progressoSuave.claro).toBe("greenTint"); // a barra do perfil era #E2F6D5 fixo
  });

  it("o painel do modal e o #163300 do desenho no escuro (design-modais.html)", () => {
    expect(coresDoTema("escuro").painel).toBe("#163300");
    expect(coresDoTema("escuro").sobrePainel).toBe("#1F3F0B");
  });

  it.each(
    NOMES_DE_PAPEL.flatMap((papel) =>
      ((papeis[papel] as { textos?: string[] }).textos ?? []).flatMap((texto) =>
        TEMAS.map((tema) => [`${texto} sobre ${papel} (${tema})`, papel, texto, tema] as const),
      ),
    ),
  )("%s passa em 4,5:1", (_nome, papel, texto, tema) => {
    const cores = coresDoTema(tema);
    expect(razao(cores[texto as NomeDeCor], cores[papel])).toBeGreaterThanOrEqual(4.5);
  });
});

describe("tema.ts", () => {
  it("o padrao e CLARO e valor estranho nunca liga o escuro", () => {
    expect(preferenciaValida(undefined)).toBe("claro");
    expect(preferenciaValida(null)).toBe("claro");
    expect(preferenciaValida("")).toBe("claro");
    expect(preferenciaValida("dark")).toBe("claro");
    expect(preferenciaValida("escuro")).toBe("escuro");
    expect(preferenciaValida("automatico")).toBe("automatico");
  });

  it("claro e escuro ignoram o aparelho; so o automatico o segue", () => {
    expect(resolverTema("claro", "dark")).toBe("claro");
    expect(resolverTema("escuro", "light")).toBe("escuro");
    expect(resolverTema("automatico", "dark")).toBe("escuro");
    expect(resolverTema("automatico", "light")).toBe("claro");
    // aparelho sem tema informado: claro, nunca escuro.
    expect(resolverTema("automatico", null)).toBe("claro");
    expect(resolverTema("automatico", undefined)).toBe("claro");
  });

  it("toda preferencia tem rotulo", () => {
    expect(PREFERENCIAS.map((p) => ROTULO_DA_PREFERENCIA[p])).toEqual(["Claro", "Escuro", "Automático"]);
  });

  it("coresDoTema devolve o mesmo objeto (serve de dependencia de memo) com todos os nomes", () => {
    expect(coresDoTema("claro")).toBe(coresDoTema("claro"));
    for (const tema of TEMAS) {
      expect(Object.keys(coresDoTema(tema)).sort()).toEqual([...NOMES_DE_COR].sort());
    }
  });

  it("canais e nomeDaVariavel", () => {
    expect(canais("#9FE870")).toBe("159 232 112");
    expect(canais("#163300")).toBe("22 51 0");
    expect(() => canais("verde")).toThrow(/tokens\.json/);
    expect(nomeDaVariavel("surface")).toBe("--vupth-surface");
    expect(nomeDaVariavel("surfaceAlt")).toBe("--vupth-surface-alt");
    expect(nomeDaVariavel("onAccentPeach")).toBe("--vupth-on-accent-peach");
  });

  it("varsDoTema tem uma variavel por cor, nos dois temas", () => {
    const claro = varsDoTema("claro");
    const escuro = varsDoTema("escuro");
    expect(Object.keys(claro)).toHaveLength(NOMES_DE_COR.length);
    expect(Object.keys(escuro)).toEqual(Object.keys(claro));
    expect(claro["--vupth-surface"]).toBe("243 245 241");
    expect(escuro["--vupth-surface"]).toBe("22 51 0");
    expect(escuro["--vupth-text-primary"]).toBe("243 245 241");
  });

  it("o veu do escuro e mais denso e preto (design-modais.html)", () => {
    expect(veuDoTema("claro")).toBe("rgba(22,51,0,.35)");
    expect(veuDoTema("escuro")).toBe("rgba(0,0,0,.55)");
  });
});

describe("tailwind.config.js — as classes vupth-* leem as variaveis", () => {
  const vupth: Record<string, string> = tailwind.theme.extend.colors.vupth;

  it("cada cor e rgb(var(--vupth-x) / <alpha-value>): classe e opacidade (/15) seguem valendo", () => {
    for (const nome of NOMES_DE_COR) {
      expect(vupth[nome]).toBe(`rgb(var(${nomeDaVariavel(nome)}) / <alpha-value>)`);
    }
  });

  it("nenhuma cor nova no tailwind sem passar pelo tokens.json ou pelos papeis", () => {
    expect(Object.keys(vupth).sort()).toEqual([...NOMES_DE_COR].sort());
  });

  it("o :root de reserva do tailwind e o tema CLARO de tema.ts (as duas regras concordam)", () => {
    let base: Record<string, Record<string, string>> = {};
    const plugins = tailwind.plugins as { handler: (api: unknown) => void }[];
    for (const p of plugins) p.handler({ addBase: (b: typeof base) => (base = { ...base, ...b }) });
    expect(base[":root"]).toEqual(varsDoTema("claro"));
  });
});

describe("interruptorDoTema", () => {
  it("no claro e o trilho, o verde e a bolinha de antes", () => {
    expect(interruptorDoTema(coresDoTema("claro"))).toEqual({
      trackColor: { false: "#D7DDD3", true: "#9FE870" },
      thumbColor: "#FFFFFF",
      ios_backgroundColor: "#D7DDD3",
    });
  });

  it("no escuro o trilho desligado e a borda do tema e a bolinha continua branca", () => {
    const escuro = coresDoTema("escuro");
    expect(interruptorDoTema(escuro)).toEqual({
      trackColor: { false: escuro.border, true: escuro.green },
      thumbColor: BRANCO,
      ios_backgroundColor: escuro.border,
    });
  });
});

describe("Cores", () => {
  it("o tipo cobre tokens e papeis", () => {
    const cores: Cores = coresDoTema("claro");
    expect(cores.painel).toBe(cores.background);
    expect(cores.selecionado).toBe(cores.forest);
  });
});
