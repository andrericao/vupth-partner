// Identidade do diálogo por TIPO (design-modais, 17/10; pedido do Andre em
// 15/10, DEC-50: "os modais de alerta devem ter indicações diferentes").
//
// A regra em uma linha: o tipo é dito por uma FAIXA no topo e um SELO com
// ícone, nunca pela cor do botão. O primário é sempre brandGreen + forest; só a
// ação destrutiva troca para danger. O erro que isto evita: a borda da mesma
// cor do fundo, que era a única "identidade" que o cartão tinha.
//
// O componente recebe a VARIANTE, nunca um hex (DESIGN.md §5). A tabela abaixo
// guarda NOMES do tokens.json (e dos papéis de papeis.json), e o hex de cada um
// sai de `coresDoTema(tema)`: claro e escuro lêem a mesma fonte que as classes
// `vupth-*`, e nenhum hex nasce aqui (a catraca de cor trava).
import { coresDoTema, type Cores, type Tema } from "@theme/tema";

export type TipoDeDialogo = "informacao" | "atencao" | "dinheiro" | "erro";

export const TIPOS_DE_DIALOGO: TipoDeDialogo[] = ["informacao", "atencao", "dinheiro", "erro"];

export function tipoValido(tipo: unknown): tipo is TipoDeDialogo {
  return typeof tipo === "string" && (TIPOS_DE_DIALOGO as string[]).includes(tipo);
}

/** As cores que o diálogo usa, pelos nomes do tokens.json. */
const NOMES_DO_DIALOGO = [
  "green",
  "onGreen",
  "greenTint",
  "onGreenTint",
  "accentPeach",
  "onAccentPeach",
  "dangerTint",
  "danger",
  "onDanger",
  "surface",
  "textPrimary",
  "textSecondary",
] as const;

type Token = (typeof NOMES_DO_DIALOGO)[number];

/** Os hex do diálogo num tema, por nome (a mesma tabela da Design, `tokens.json`). */
export function tokensDoDialogo(tema: Tema): Record<Token, string> {
  const cores = coresDoTema(tema);
  return Object.fromEntries(NOMES_DO_DIALOGO.map((nome) => [nome, cores[nome]])) as Record<Token, string>;
}

/** Tema claro, pelos nomes do tokens.json. */
export const TOKENS_CLARO = tokensDoDialogo("claro");

// Faixa de atenção: o desenho a quer no PÊSSEGO #FFC091 nos dois temas
// (design-modais.html: "no escuro, onAccentPeach, o mesmo pêssego"). O token
// `accentPeach` no escuro é o marrom do fundo do selo, e uma faixa dele sumiria
// sobre o painel; o papel `pessego` é o #FFC091 como COR (claro: accentPeach,
// escuro: onAccentPeach).
type Nome = keyof Cores;

const TIPOS: Record<TipoDeDialogo, { fundo: Nome; texto: Nome; corDaFaixa: Nome | null; faixa: boolean; selo: string }> = {
  // Fato sem consequência: pedido enviado, você trocou de lugar.
  informacao: { fundo: "greenTint", texto: "onGreenTint", corDaFaixa: "green", faixa: true, selo: "Aviso" },
  // Prazo ou estado que pede ação: hora do almoço, fechamento, loja sem ponto.
  atencao: { fundo: "accentPeach", texto: "onAccentPeach", corDaFaixa: "pessego", faixa: true, selo: "Atenção" },
  // Tudo que tem R$. Mesma cor do erro; o que os separa é a faixa.
  dinheiro: { fundo: "dangerTint", texto: "danger", corDaFaixa: "danger", faixa: true, selo: "Pagamento" },
  // Resposta a um toque que a pessoa acabou de dar: só o selo, sem faixa. Com
  // três vermelhos ninguém distinguiria nada; com faixa × sem faixa, sim.
  erro: { fundo: "dangerTint", texto: "danger", corDaFaixa: null, faixa: false, selo: "Erro" },
};

export type AparenciaDoTipo = {
  faixa: boolean;
  /** Cor da faixa de 6 px: FORTE (verde, pêssego, danger). O fundo do selo é o tom claro. */
  corDaFaixa: string | null;
  fundo: string;
  texto: string;
  selo: string;
};

/**
 * `selo` troca o rótulo ("Multa" no lugar de "Pagamento") sem trocar o tipo.
 * `tema` escolhe a coluna do tokens.json: sem ele é o claro, como sempre foi.
 */
export function aparenciaDoTipo(tipo: TipoDeDialogo, selo?: string, tema: Tema = "claro"): AparenciaDoTipo {
  const t = TIPOS[tipo];
  const cores = coresDoTema(tema);
  return {
    faixa: t.faixa,
    // A faixa em dangerTint (#F7E4E2) sobre o branco do cartao mal se ve: a tabela
    // dizia "faixa e selo: dangerTint" e os mockups desenhavam a faixa forte. Vale o
    // mockup: o tipo e dito por uma faixa que se ENXERGA, e o selo fica no tom claro.
    corDaFaixa: t.corDaFaixa ? cores[t.corDaFaixa] : null,
    fundo: cores[t.fundo],
    texto: cores[t.texto],
    selo: selo?.trim() || t.selo,
  };
}

export type PapelDoBotao = "primario" | "secundario" | "perigo";

/**
 * Fundo e rótulo de cada papel de botão (design-modais: primário green + forest nos
 * dois temas; secundário é o bloco DENTRO do painel, `sobrePainel`, porque a
 * surface do escuro é a cor do próprio painel; perigo é danger com onDanger).
 */
export function aparenciaDoBotao(papel: PapelDoBotao, tema: Tema = "claro"): { fundo: string; texto: string } {
  const cores = coresDoTema(tema);
  if (papel === "primario") return { fundo: cores.green, texto: cores.onGreen };
  if (papel === "perigo") return { fundo: cores.danger, texto: cores.onDanger };
  return { fundo: cores.sobrePainel, texto: cores.textPrimary };
}

type EstiloDoBotao = { estilo?: "default" | "cancel" | "destructive" };

/**
 * Qual papel cada botão tem num diálogo com tipo.
 *
 * Diferente do `pesoDoBotao` (o diálogo sem tipo, que dá o peso à saída segura):
 * aqui o primário é a ação que CONFIRMA o título. Se ela é destrutiva (sair da
 * fila com multa, excluir) o primário é `danger`; o cancelar é sempre o
 * secundário. Sem destrutivo, o primeiro "default" é o verde e os outros viram
 * secundários — nunca dois primários empilhados.
 */
export function papelDoBotao(botoes: EstiloDoBotao[], i: number): PapelDoBotao {
  const estilo = botoes[i]?.estilo ?? "default";
  if (estilo === "destructive") return "perigo";
  if (estilo === "cancel") return "secundario";
  const temDestrutivo = botoes.some((b) => b.estilo === "destructive");
  if (temDestrutivo) return "secundario";
  const primeiroDefault = botoes.findIndex((b) => (b.estilo ?? "default") === "default");
  return primeiroDefault === i ? "primario" : "secundario";
}

/**
 * Ordem em que os botões aparecem: o primário em cima, o "Cancelar" embaixo
 * (design-modais: "pílulas empilhadas, primário em cima"). O ÍNDICE que o
 * diálogo devolve é o da lista original — quem chama (e o `dialogo-botao-N` da
 * bateria Maestro) continua achando cada botão onde sempre achou.
 */
export function ordemDosBotoes(botoes: EstiloDoBotao[]): number[] {
  const peso = (i: number) => (botoes[i]?.estilo === "cancel" ? 1 : 0);
  return botoes
    .map((_, i) => i)
    .sort((a, b) => peso(a) - peso(b) || a - b);
}
