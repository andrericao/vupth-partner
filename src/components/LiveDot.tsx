import { useEffect, useState } from "react";
import { Animated, AccessibilityInfo, Easing } from "react-native";
import { useTema } from "@hooks/useTema";

type Props = {
  size?: number;
  /** Cor do ponto (vem de `useTema().cores`: Animated.View nao resolve classe). Sem ela, textPrimary. */
  color?: string;
  /**
   * Pulsa? Default `true`.
   *
   * ⚠️ Passe `false` quando o estado NAO for ao vivo. O mesmo ponto serve
   * "ATENDENDO AGORA" e "ATENDIMENTO PAUSADO" — piscar num atendimento parado
   * sinaliza movimento que nao esta acontecendo.
   */
  pulsing?: boolean;
};

/**
 * Ponto de status que PISCA quando o estado e ao vivo.
 * Espelha `src/components/LiveDot.tsx` do client — mesma animacao e regra.
 *
 * Pulso de opacidade (1 -> 0.3 -> 1) em ~1,4s com `useNativeDriver`, entao nao
 * passa por JS a cada frame. Respeita reduce-motion: com a preferencia ligada
 * o ponto fica FIXO e opaco. Piscar e exatamente o movimento que essa
 * preferencia existe pra desligar, e o estado segue legivel sem ele — a cor e
 * o rotulo ao lado ja dizem tudo.
 */
export function LiveDot({ size = 8, color, pulsing = true }: Props) {
  const { cores } = useTema();
  const [opacity] = useState(() => new Animated.Value(1));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub?.remove?.();
  }, []);

  useEffect(() => {
    if (!pulsing || reduceMotion) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulsing, reduceMotion, opacity]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color ?? cores.textPrimary,
        opacity,
      }}
    />
  );
}
