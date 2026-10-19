import { ReactNode, useRef, useState } from "react";
import { Animated, LayoutChangeEvent } from "react-native";
import { EASE, movimentoReduzido } from "@lib/motion";

// A linha que mudou de lugar desliza do lugar antigo para o novo em vez de saltar.
//
// Por que medir e não usar LayoutAnimation: o LayoutAnimation precisa ser armado
// ANTES de o layout rodar, e aqui a lista chega de uma query que se atualiza por
// fora; armado depois do commit ele pode simplesmente não ter efeito no Fabric, e
// só um aparelho diria. Aqui a conta é determinística: guardamos o `y` de cada
// linha, e quando ele muda a linha começa deslocada da diferença e anda até zero.
// Só `transform`, no driver nativo, como o resto do movimento do app.
//
// Há um quadro em que a linha aparece já no lugar novo antes de o deslocamento
// valer: é o preço de medir depois do layout, e some dentro de um frame.
export function LinhaQueSeMove({ children }: { children: ReactNode }) {
  const [desloc] = useState(() => new Animated.Value(0));
  const anterior = useRef<number | null>(null);
  const noAr = useRef<Animated.CompositeAnimation | null>(null);

  const medir = (e: LayoutChangeEvent) => {
    const y = e.nativeEvent.layout.y;
    const antes = anterior.current;
    anterior.current = y;
    if (antes === null || antes === y) return;
    const diferenca = antes - y;
    movimentoReduzido().then((reduzido) => {
      if (reduzido) return;
      // Uma segunda mudança dentro dos 300 ms recomeça da nova diferença, com um salto
      // pequeno. Partir de onde a linha está agora exigiria o valor do driver nativo
      // (um callback assíncrono que o jest não simula), e o caso é raro: duas
      // mudanças de ordem em menos de 0,3 s.
      noAr.current?.stop();
      desloc.setValue(diferenca);
      noAr.current = Animated.timing(desloc, { toValue: 0, duration: 300, easing: EASE.entrada, useNativeDriver: true });
      noAr.current.start();
    });
  };

  return (
    <Animated.View onLayout={medir} style={{ transform: [{ translateY: desloc }] }}>
      {children}
    </Animated.View>
  );
}
