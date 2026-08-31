/**
 * Cada doodle e desenhado com duas cores: o traco e uma cor de apoio que
 * preenche roupa e cabelo. Sao as duas que o tema controla.
 */
export interface DoodleArtProps {
  ink: string;
  accent: string;
  width: number;
  height: number;
}
