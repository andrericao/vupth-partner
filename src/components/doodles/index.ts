import type { DoodleArtProps } from "./types";
import { ChillingDoodle } from "./ChillingDoodle";
import { SittingDoodle } from "./SittingDoodle";
import { StrollingDoodle } from "./StrollingDoodle";
import { UnboxingDoodle } from "./UnboxingDoodle";

export type { DoodleArtProps };

// Cores em HEX, nao em classe: estes valores entram como `fill` dentro de um
// <Svg>, e className do NativeWind nao chega la. Mesmo caso do TabBarIcon.
// A guarda contra divergencia e o teste em `__tests__/doodles.test.ts`, que
// compara cada hex daqui com o token correspondente no tailwind.config.
const FOREST = "#163300";
const GREEN_TINT = "#E2F6D5";
const ACCENT_BLUE = "#A0E1E1";
const ACCENT_PEACH = "#FFC091";
const ACCENT_PINK = "#FFD7EF";

export const DOODLE_INK = FOREST;

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
