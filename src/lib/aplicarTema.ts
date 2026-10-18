import { Appearance } from "react-native";
import { DarkTheme, DefaultTheme, type Theme } from "@react-navigation/native";
import type { Cores, Preferencia, Tema } from "@theme/tema";

// O que o tema precisa fazer ALEM de trocar as variaveis do NativeWind: avisar
// o sistema (teclado, barra de navegacao, caixas nativas) e, na web, pintar o
// que fica FORA da arvore do app.

/**
 * O que pedir ao sistema: `light`/`dark` fixam, `null` devolve ao aparelho.
 * Sem isso quem escolheu "Claro" e tem o celular no escuro veria o teclado e
 * as caixas nativas escuras sobre um app claro (e o inverso para "Escuro").
 */
export function esquemaDoSistema(preferencia: Preferencia): "light" | "dark" | null {
  if (preferencia === "claro") return "light";
  if (preferencia === "escuro") return "dark";
  return null;
}

/** `Appearance.setColorScheme` nao existe no react-native-web: la nao ha o que avisar. */
export function pedirEsquemaAoSistema(preferencia: Preferencia): void {
  if (typeof Appearance.setColorScheme !== "function") return;
  try {
    Appearance.setColorScheme(esquemaDoSistema(preferencia));
  } catch {
    // Um aparelho que recusa o pedido continua com o esquema dele: o app ja
    // pinta o proprio tema por conta.
  }
}

type RaizDaWeb = Pick<HTMLElement, "style">;

/**
 * Na web o `Modal` do react-native-web vai para um portal em `document.body`,
 * FORA da View raiz onde `vars()` poe as variaveis: sem isto o diálogo abriria
 * sem cor nenhuma. As variaveis tambem vao no <html>, que o portal herda, e o
 * fundo e o `color-scheme` acompanham (barra de rolagem, campo nativo).
 */
export function espelharNaWeb(
  tema: Tema,
  cores: Pick<Cores, "background">,
  vars: Record<string, string>,
  raiz: RaizDaWeb | undefined = typeof document === "undefined" ? undefined : document.documentElement,
): void {
  if (!raiz) return;
  for (const [nome, valor] of Object.entries(vars)) raiz.style.setProperty(nome, valor);
  raiz.style.setProperty("color-scheme", tema === "escuro" ? "dark" : "light");
  raiz.style.setProperty("background-color", cores.background);
}

/**
 * O tema do React Navigation: e ele que pinta o fundo atras das telas. No
 * claro e EXATAMENTE o de antes (o padrao dele com o `background` da marca);
 * so o escuro troca tambem cartao, texto e borda, que o navegador desenharia
 * com o cinza dele.
 */
export function temaDeNavegacao(
  escuro: boolean,
  cores: Pick<Cores, "background" | "surface" | "textPrimary" | "border">,
): Theme {
  const base = escuro ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: cores.background,
      ...(escuro ? { card: cores.surface, text: cores.textPrimary, border: cores.border } : {}),
    },
  };
}
