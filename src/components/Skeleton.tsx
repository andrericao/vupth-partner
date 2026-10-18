import { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { useTema } from "@hooks/useTema";

// [new-design] Skeleton loading (R4): placeholders com a forma do conteudo,
// no lugar dos Spinner. Pulso de opacidade (Animated nativo, sem dep extra).
// Migrado p/ NativeWind (v2).

// Os blocos ficam DENTRO do card fantasma, que e `surface` plano igual ao card
// real. No claro o unico neutro da paleta que aparece sobre ele e o `border`
// (era #E2E9E5, cinza da paleta pre-marca); no escuro o `border` e um verde vivo
// e berraria, entao a cor vem do papel `esqueleto` (surfaceAlt, discreto).

function usePulse() {
  const [v] = useState(() => new Animated.Value(0.45));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return v;
}

function Block({
  opacity,
  w,
  h = 12,
  r = 8,
}: {
  opacity: Animated.Value;
  w: number | string;
  h?: number;
  r?: number;
}) {
  const { cores } = useTema();
  return (
    <Animated.View
      style={{ width: w as any, height: h, borderRadius: r, backgroundColor: cores.esqueleto, opacity }}
    />
  );
}

/** Um card "fantasma" com a mesma forma dos cards reais (surface, raio 20, plano). */
export function SkeletonCard() {
  const opacity = usePulse();
  return (
    <View className="bg-vupth-surface p-4 rounded-card mb-3">
      <View className="flex-row justify-between items-center">
        <Block opacity={opacity} w="45%" h={14} />
        <Block opacity={opacity} w={64} h={22} r={999} />
      </View>
      <View className="mt-3 gap-2">
        <Block opacity={opacity} w="70%" />
        <Block opacity={opacity} w="40%" />
      </View>
    </View>
  );
}

/** Lista de SkeletonCard para telas de lista/dados enquanto carrega. */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

/**
 * A forma de UM texto enquanto o dado nao chega (Andre, 02/10: "Profissional"
 * no lugar do nome parecia erro). Nunca um texto generico que pareca dado.
 * `escuro` = sobre o fundo forest (cabecalho do Perfil).
 */
export function SkeletonTexto({
  largura,
  altura = 14,
  escuro = false,
  testID = "skeleton-texto",
}: {
  largura: number | string;
  altura?: number;
  escuro?: boolean;
  testID?: string;
}) {
  const opacity = usePulse();
  const { cores } = useTema();
  return (
    <Animated.View
      testID={testID}
      accessibilityLabel="Carregando"
      style={{
        width: largura as any,
        height: altura,
        borderRadius: 8,
        // tema-fixo: o cabecalho do Perfil e forest nos dois temas, entao o branco translucido vale nos dois
        backgroundColor: escuro ? "rgba(255,255,255,0.22)" : cores.esqueleto,
        opacity,
      }}
    />
  );
}
