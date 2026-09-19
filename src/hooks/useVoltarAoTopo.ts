import { useRef } from "react";
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
