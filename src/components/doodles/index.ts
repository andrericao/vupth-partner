import type { NomeDeCor } from "@theme/tema";
import type { DoodleArtProps } from "./types";
import { ChillingDoodle } from "./ChillingDoodle";
import { SittingDoodle } from "./SittingDoodle";
import { StrollingDoodle } from "./StrollingDoodle";
import { UnboxingDoodle } from "./UnboxingDoodle";

export type { DoodleArtProps };

// As cores entram como `fill` dentro de um <Svg>, onde o className do
// NativeWind nao chega, entao o registro guarda o NOME da cor do tema e o
// <Doodle> a resolve com `useTema().cores`: no escuro o acento vira o escuro do
// mesmo matiz e o traco (forest no claro) vira textPrimary, claro sobre escuro.
// A guarda e o teste em `__tests__/doodles.test.ts`.
const GREEN_TINT: NomeDeCor = "greenTint";
const ACCENT_BLUE: NomeDeCor = "accentBlue";
const ACCENT_PEACH: NomeDeCor = "accentPeach";
const ACCENT_PINK: NomeDeCor = "accentPink";

/** O traco: forest no claro (textPrimary), claro sobre escuro no escuro. */
export const DOODLE_INK: NomeDeCor = "textPrimary";

/**
 * Open Doodles, de Pablo Stanley (CC0). Mesmo autor do Open Peeps que os
 * avatares usam, entao o traco combina sem ajuste.
 *
 * SO ESTADOS VAZIOS. A colecao desenha situacoes e humores — alguem sentado
 * sozinho, uma caixa vazia, alguem caminhando — e nao servicos: nao ha figura
 * de barbearia, unha, sobrancelha nem clinica. Em cartao de categoria a
 * escolha sairia arbitraria, entao la o icone continua sendo o que informa.
 *
 * O nome e a SITUACAO, nao a pose: quem escreve a tela pede "nada encontrado"
 * sem precisar lembrar que o desenho e alguem abrindo uma caixa.
 */
export const DOODLES = {
  /** Ninguem por perto: fila vazia, sem outras pessoas. */
  fila: { art: SittingDoodle, accent: ACCENT_BLUE },
  /** Nada marcado, nada acontecendo agora. */
  tempo: { art: ChillingDoodle, accent: ACCENT_PEACH },
  /** Nada por perto, nenhum endereco salvo. */
  local: { art: StrollingDoodle, accent: GREEN_TINT },
  /** A busca nao achou nada: a caixa veio vazia. */
  busca: { art: UnboxingDoodle, accent: ACCENT_PINK },
} as const;

export type DoodleName = keyof typeof DOODLES;
