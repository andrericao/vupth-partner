import tokens from "./tokens.json";
import { papeis as PAPEIS } from "./papeis.json";

// Tema claro/escuro (DEC-75, 16/10). A UNICA fonte dos valores e o
// `tokens.json` desta pasta, copia de vupth-docs/fontes/design/tokens.json (o CI
// nao enxerga o vupth-docs). Nada aqui escreve um hex: tudo sai do JSON, e o
// `tema.test.ts` mede de novo cada par de `verificacao` do proprio arquivo.
//
// Como chega as telas: o tailwind.config.js le cada cor `vupth.*` de uma
// VARIAVEL CSS (rgb(var(--vupth-surface) / <alpha-value>)) e o layout raiz as
// define com `vars(varsDoTema(tema))` — o mesmo caminho do tamanho da letra
// (src/lib/fonte.ts). Trocar o tema troca as variaveis, e o NativeWind reaplica
// em toda classe `bg-vupth-*` / `text-vupth-*` sem mexer em nenhuma delas.
// Cor que o codigo escreve em prop (icone, trackColor, veu) NAO passa pelo
// NativeWind: essa vem de `useTema().cores`.

export type Tema = "claro" | "escuro";
/** O que a pessoa escolhe. `automatico` segue o tema do aparelho. */
export type Preferencia = Tema | "automatico";
/** Uma cor do tokens.json (a tabela da Design). */
export type NomeDeToken = keyof typeof tokens.cor;
/** Um lugar onde o desenho troca de token entre os temas (papeis.json). */
export type NomeDePapel = keyof typeof PAPEIS;
/** Tudo o que vira classe `vupth-*` e variavel: os tokens e os papeis. */
export type NomeDeCor = NomeDeToken | NomeDePapel;
export type Cores = Record<NomeDeCor, string>;

export const PREFERENCIAS: readonly Preferencia[] = ["claro", "escuro", "automatico"];

export const ROTULO_DA_PREFERENCIA: Record<Preferencia, string> = {
  claro: "Claro",
  escuro: "Escuro",
  automatico: "Automático",
};

/** Os nomes do tokens.json, na ordem do arquivo. */
export const NOMES_DE_TOKEN = Object.keys(tokens.cor) as NomeDeToken[];
export const NOMES_DE_PAPEL = Object.keys(PAPEIS) as NomeDePapel[];
/** Tokens e papeis: o que o tailwind.config.js expoe como `vupth.*`. */
export const NOMES_DE_COR: NomeDeCor[] = [...NOMES_DE_TOKEN, ...NOMES_DE_PAPEL];

/** Qual token o papel usa no tema. */
export function tokenDoPapel(papel: NomeDePapel, tema: Tema): NomeDeToken {
  return PAPEIS[papel][tema] as NomeDeToken;
}

// O padrao e CLARO: um valor desconhecido (chave corrompida no aparelho, versao
// futura do app) nunca liga o escuro sozinho.
export function preferenciaValida(valor: unknown): Preferencia {
  return valor === "escuro" || valor === "automatico" ? valor : "claro";
}

/**
 * Preferencia + tema do aparelho = o tema que vale. O aparelho so conta no
 * `automatico`; "claro" e "escuro" ignoram o sistema de proposito.
 */
export function resolverTema(preferencia: Preferencia, sistema: string | null | undefined): Tema {
  if (preferencia === "automatico") return sistema === "dark" ? "escuro" : "claro";
  return preferencia;
}

const POR_TEMA = {} as Record<Tema, Cores>;
for (const tema of ["claro", "escuro"] as const) {
  POR_TEMA[tema] = Object.fromEntries([
    ...NOMES_DE_TOKEN.map((nome) => [nome, tokens.cor[nome][tema]]),
    ...NOMES_DE_PAPEL.map((papel) => [papel, tokens.cor[tokenDoPapel(papel, tema)][tema]]),
  ]) as Cores;
}

/** Os hex do tema, por nome. O mesmo objeto a cada chamada (serve de dependencia de memo). */
export function coresDoTema(tema: Tema): Cores {
  return POR_TEMA[tema];
}

/** Veu atras de modal: o escuro precisa de mais densidade para separar o diálogo. */
export function veuDoTema(tema: Tema): string {
  return tema === "escuro" ? tokens.primitivas.modal.veuEscuro : tokens.primitivas.modal.veuClaro;
}

/** "#9FE870" -> "159 232 112": o formato que `rgb(var(--x) / <alpha-value>)` espera. */
export function canais(hex: string): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`cor invalida no tokens.json: ${hex}`);
  return `${parseInt(m[1], 16)} ${parseInt(m[2], 16)} ${parseInt(m[3], 16)}`;
}

/** O branco fixo da bolinha do interruptor (design.html, DS7: "bolinha branca") nos dois temas. */
export const BRANCO = "#FFFFFF";

/**
 * As props de cor do `Switch`: trilho desligado `border`, ligado `green`, bolinha
 * branca (design.html, DS7). O `Switch` nao resolve classe, entao e prop.
 */
export function interruptorDoTema(cores: Cores) {
  return {
    trackColor: { false: cores.border, true: cores.green },
    thumbColor: BRANCO,
    ios_backgroundColor: cores.border,
  };
}

/** surfaceAlt -> --vupth-surface-alt (o tailwind.config.js usa a mesma regra). */
export function nomeDaVariavel(nome: string): string {
  return `--vupth-${nome.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}`;
}

/** As variaveis CSS do tema, prontas para `vars()` do NativeWind. */
export function varsDoTema(tema: Tema): Record<string, string> {
  const cores = coresDoTema(tema);
  return Object.fromEntries(NOMES_DE_COR.map((nome) => [nomeDaVariavel(nome), canais(cores[nome])]));
}
