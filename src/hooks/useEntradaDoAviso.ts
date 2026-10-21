import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing } from "react-native";

// Entrada de faixa/aviso (desenho de motion, 17/10): fade + deslize de 12 px em
// 400 ms, na curva padrao do app. So opacity e transform animam — altura e
// cor travam a thread de UI no aparelho medio.
const DURACAO_MS = 400;
const DESLIZE_PX = 12;
const CURVA = Easing.bezier(0.2, 0.8, 0.2, 1);

/**
 * Estilo animado para o aviso que aparece quando `ativo` vira true.
 *
 * Com "remover animacoes" ligado no aparelho o aviso aparece pronto: um aviso
 * que pede acao nao pode depender de animacao para ser visto. Se a consulta ao
 * sistema falhar, vale o mesmo — melhor sem movimento que sem aviso.
 */
export function useEntradaDoAviso(ativo: boolean) {
  const [progresso] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Sai e volta: recomeca do zero, senao a 2a entrada nao teria o que animar.
    progresso.setValue(0);
    if (!ativo) return;

    let cancelado = false;
    let animacao: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(
        (reduzido) => reduzido,
        () => true
      )
      .then((reduzido) => {
        if (cancelado) return;
        if (reduzido) {
          progresso.setValue(1);
          return;
        }
        animacao = Animated.timing(progresso, {
          toValue: 1,
          duration: DURACAO_MS,
          easing: CURVA,
          useNativeDriver: true,
        });
        animacao.start();
      });

    return () => {
      cancelado = true;
      animacao?.stop();
    };
  }, [ativo, progresso]);

  return {
    opacity: progresso,
    transform: [{ translateY: progresso.interpolate({ inputRange: [0, 1], outputRange: [DESLIZE_PX, 0] }) }],
  };
}
