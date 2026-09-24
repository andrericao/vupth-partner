import { useCallback, useRef, useState, type RefObject } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useScrollToTop } from "@react-navigation/native";

// 🔴 Andre, 18/09: "desci até bem embaixo e cliquei no ícone da aba já ativa —
// a tela não voltou ao topo". É o gesto padrao de quem desceu demais numa lista.
//
// Quem faz o trabalho e o `useScrollToTop` do @react-navigation/native: ele
// escuta o `tabPress` da aba JA ATIVA e rola o container do ref. Escrever o
// listener na mao daria o mesmo, pior.
//
// Este hook existe por causa do TIPO, nao da logica: o `ScrollView` das telas
// vem embrulhado (NativeWind num lado, Gluestack v1 no outro), e o ref desses
// embrulhos nao casa com o `ScrollableWrapper` que a navegacao espera. Em vez de
// espalhar um cast por sete telas, o cast mora aqui, com o motivo escrito.
export function useVoltarAoTopo() {
  const ref = useRef<any>(null);
  useScrollToTop(ref);
  return ref;
}

/**
 * A pílula "↑ Voltar ao topo" aparece depois que a pessoa rolou MAIS DE UMA
 * TELA — antes disso o topo ainda está a um gesto de distância. Sem a medida
 * da tela (0), não aparece.
 */
export function deveMostrarPilula(deslocamentoY: number, alturaDaTela: number): boolean {
  if (!(alturaDaTela > 0)) return false;
  return deslocamentoY > alturaDaTela;
}

// 🔴 Andre, 24/09: "quero um botão flutuante como o do Spotify, que aparece
// suave no rodapé, é uma pílula". Complementa o toque na aba ativa: aquele
// gesto é invisível; a pílula aparece para quem desceu.
//
// `setVisivel` com o mesmo valor não re-renderiza, então chamar a cada evento
// de rolagem não custa um render por pixel — só quando o limite é cruzado.
export function usePilulaTopo(ref: RefObject<any>) {
  const [visivel, setVisivel] = useState(false);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = e.nativeEvent;
    setVisivel(deveMostrarPilula(contentOffset.y, layoutMeasurement.height));
  }, []);

  const subir = useCallback(() => {
    ref.current?.scrollTo?.({ y: 0, animated: true });
  }, [ref]);

  return { visivel, onScroll, subir };
}

