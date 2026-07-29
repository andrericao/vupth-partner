import { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { cardShadow } from "@lib/styles";

// [new-design] Skeleton loading (R4): placeholders com a forma do conteudo,
// no lugar dos Spinner. Pulso de opacidade (Animated nativo, sem dep extra).
// Migrado p/ NativeWind (v2).

const BASE = "#E2E9E5";

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
  return (
    <Animated.View
      style={{ width: w as any, height: h, borderRadius: r, backgroundColor: BASE, opacity }}
    />
  );
}

/** Um card "fantasma" com a mesma forma dos cards reais (cantos $2xl + cardShadow). */
export function SkeletonCard() {
  const opacity = usePulse();
  return (
    <View className="bg-white p-4 rounded-2xl mb-3" style={cardShadow}>
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
