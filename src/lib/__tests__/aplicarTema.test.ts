import { Appearance } from "react-native";
import { DefaultTheme, DarkTheme } from "@react-navigation/native";
import { coresDoTema, varsDoTema } from "@theme/tema";
import { esquemaDoSistema, espelharNaWeb, pedirEsquemaAoSistema, temaDeNavegacao } from "@lib/aplicarTema";

describe("esquemaDoSistema", () => {
  it("claro e escuro fixam; automatico devolve ao aparelho (null)", () => {
    expect(esquemaDoSistema("claro")).toBe("light");
    expect(esquemaDoSistema("escuro")).toBe("dark");
    expect(esquemaDoSistema("automatico")).toBeNull();
  });
});

describe("pedirEsquemaAoSistema", () => {
  afterEach(() => jest.restoreAllMocks());

  it("pede ao sistema o esquema da preferencia", () => {
    const pedir = jest.spyOn(Appearance, "setColorScheme").mockImplementation(() => undefined);
    pedirEsquemaAoSistema("escuro");
    expect(pedir).toHaveBeenCalledWith("dark");
    pedirEsquemaAoSistema("automatico");
    expect(pedir).toHaveBeenLastCalledWith(null);
  });

  it("aparelho que recusa o pedido nao derruba o app", () => {
    jest.spyOn(Appearance, "setColorScheme").mockImplementation(() => {
      throw new Error("recusado");
    });
    expect(() => pedirEsquemaAoSistema("claro")).not.toThrow();
  });

  it("onde nao existe setColorScheme (web) nao faz nada", () => {
    const original = Appearance.setColorScheme;
    // @ts-expect-error simula o react-native-web, que nao tem o metodo
    Appearance.setColorScheme = undefined;
    try {
      expect(() => pedirEsquemaAoSistema("escuro")).not.toThrow();
    } finally {
      Appearance.setColorScheme = original;
    }
  });
});

describe("espelharNaWeb", () => {
  function raizFalsa() {
    const valores: Record<string, string> = {};
    return { valores, raiz: { style: { setProperty: (k: string, v: string) => (valores[k] = v) } } as unknown as HTMLElement };
  }

  it("poe as variaveis do tema, o color-scheme e o fundo no <html> (o portal do Modal herda)", () => {
    const { valores, raiz } = raizFalsa();
    espelharNaWeb("escuro", coresDoTema("escuro"), varsDoTema("escuro"), raiz);
    expect(valores["--vupth-surface"]).toBe("22 51 0");
    expect(valores["--vupth-painel"]).toBe("22 51 0");
    expect(valores["color-scheme"]).toBe("dark");
    expect(valores["background-color"]).toBe("#0B1A04");
  });

  it("no claro, color-scheme light e fundo branco", () => {
    const { valores, raiz } = raizFalsa();
    espelharNaWeb("claro", coresDoTema("claro"), varsDoTema("claro"), raiz);
    expect(valores["color-scheme"]).toBe("light");
    expect(valores["background-color"]).toBe("#FFFFFF");
  });

  it("sem <html> (nativo, jest) e um no-op", () => {
    expect(() => espelharNaWeb("claro", coresDoTema("claro"), {}, undefined)).not.toThrow();
  });
});

describe("temaDeNavegacao", () => {
  it("no CLARO e exatamente o tema de antes (o padrao do React Navigation + o fundo da marca)", () => {
    const antes = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: "#FFFFFF" } };
    expect(temaDeNavegacao(false, coresDoTema("claro"))).toEqual(antes);
  });

  it("no escuro parte do DarkTheme e pinta fundo, cartao, texto e borda com os tokens", () => {
    const cores = coresDoTema("escuro");
    const tema = temaDeNavegacao(true, cores);
    expect(tema.dark).toBe(true);
    expect(tema.colors).toMatchObject({
      background: cores.background,
      card: cores.surface,
      text: cores.textPrimary,
      border: cores.border,
      primary: DarkTheme.colors.primary,
    });
  });
});
