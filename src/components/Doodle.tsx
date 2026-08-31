import { View, type ViewStyle } from "react-native";

import { DOODLES, DOODLE_INK, type DoodleName } from "./doodles";

// Todos os doodles compartilham o mesmo viewBox 1024x768.
const ART_RATIO = 768 / 1024;

type Props = {
  name: DoodleName;
  /** Largura do desenho. A altura sai da proporcao original. */
  size?: number;
  /** Sobrepoe a cor de apoio do registro, para casar com o cartao. */
  accent?: string;
  /** Cor do traco. */
  ink?: string;
  style?: ViewStyle;
};

/**
 * Ilustracao de situacao, da colecao Open Doodles.
 *
 * O desenho e recortado pelo container: os doodles tem bastante ar em volta da
 * figura, e num cartao pequeno esse ar viraria quase todo o espaco. O overflow
 * escondido deixa a figura ocupar o quadro sem deformar a proporcao.
 *
 * ⚠️ E DECORACAO, e por isso sai da arvore de acessibilidade. O que a tela quer
 * dizer esta no titulo e no texto do EstadoVazio — um leitor de tela que
 * anunciasse "imagem" aqui so atrasaria quem ja recebeu a informacao.
 */
export function Doodle({ name, size = 132, accent, ink = DOODLE_INK, style }: Props) {
  const { art: Art, accent: defaultAccent } = DOODLES[name];

  return (
    <View
      style={[{ width: size, height: size * ART_RATIO, overflow: "hidden", alignItems: "center", justifyContent: "center" }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Art ink={ink} accent={accent ?? defaultAccent} width={size} height={size * ART_RATIO} />
    </View>
  );
}
