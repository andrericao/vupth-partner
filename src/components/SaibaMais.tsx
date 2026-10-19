import { Pressable, Text } from "react-native";

import { abrirArtigo, type Artigo } from "@lib/artigosDoSuporte";

// O "Saiba mais" dos cartões do app (design-modais.html: link sublinhado,
// text-xs/700, só quando há regra por trás; abre o artigo no navegador do
// sistema). Os avisos do sistema (Alert) não têm onde pôr um link: para eles
// existe `confirmarComArtigo`.
export function SaibaMais({ artigo, testID = "saiba-mais" }: { artigo: Artigo; testID?: string }) {
  return (
    <Pressable
      onPress={() => void abrirArtigo(artigo)}
      accessibilityRole="link"
      testID={testID}
      hitSlop={8}
      className="self-start"
    >
      <Text className="font-heading text-xs text-vupth-textPrimary underline">Saiba mais</Text>
    </Pressable>
  );
}
