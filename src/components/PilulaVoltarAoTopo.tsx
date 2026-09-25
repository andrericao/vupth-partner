import { useEffect, useState } from "react";
import { Animated, Pressable, Text } from "react-native";
import { ArrowUp } from "lucide-react-native";

// A pílula "↑ Voltar ao topo" (Andre, 24/09 — "como a do Spotify, que aparece
// suave no rodapé"). Desenho escolhido por ele: pílula com TEXTO, centralizada,
// logo acima da barra de abas; fundo forest e texto verde, a âncora escura da
// marca — sobre qualquer fundo de lista ela se destaca sem gritar.
//
// Mora no rodapé do CONTAINER da rolagem (position absolute): quem a usa
// envolve a lista num View flex-1. Na Fila, esse container termina acima da
// barra fixa do "Iniciar próximo", então a pílula não a cobre.
//
// Escondida, ela não some da árvore — só fica transparente, sem receber toque e
// fora do leitor de tela. Montar/desmontar faria a animação de entrada pular.
export function PilulaVoltarAoTopo({
  visivel,
  onPress,
}: {
  visivel: boolean;
  onPress: () => void;
}) {
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visivel ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visivel, anim]);

  return (
    <Animated.View
      testID="pilula-topo"
      pointerEvents={visivel ? "box-none" : "none"}
      accessibilityElementsHidden={!visivel}
      importantForAccessibility={visivel ? "auto" : "no-hide-descendants"}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 16,
        alignItems: "center",
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Voltar ao topo"
        className="flex-row items-center gap-1.5 bg-vupth-forest rounded-full px-5 py-2.5 active:opacity-80"
      >
        <ArrowUp size={16} color="#9FE870" />
        <Text className="font-heading text-sm text-vupth-green">Voltar ao topo</Text>
      </Pressable>
    </Animated.View>
  );
}
