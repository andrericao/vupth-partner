import type { ReactNode } from "react";
import { View } from "react-native";

// dot-no-canto-do-card (Andre, 24/10): o dot de pendencia de um CARD (sem subtitulo
// empilhado, como o pedido de encaixe) fica no canto superior direito. Em item de menu
// com titulo e subtitulo o dot fica AO LADO DO TITULO (dot-ao-lado-do-nome-em-menu-empilhado,
// Andre, 24/10) e nao usa este componente. Card solto (com borda
// arredondada visivel): o dot monta sobre a borda, meio para fora. Linha dentro
// de um grupo (overflow escondido): fica rente ao canto, por dentro.
export function DotNoCanto({
  children,
  dentro = false,
  testID,
}: {
  children: ReactNode;
  /** Linha de um grupo que corta o que passa da borda. */
  dentro?: boolean;
  testID?: string;
}) {
  return (
    <View
      pointerEvents="none"
      testID={testID}
      style={{ position: "absolute", top: dentro ? 6 : -4, right: dentro ? 8 : -4 }}
    >
      {children}
    </View>
  );
}
