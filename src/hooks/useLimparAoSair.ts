import { useEffect, useRef } from "react";
import { useIsFocused } from "@react-navigation/native";

/**
 * Limpa o formulário quando a tela PERDE o foco.
 *
 * 🔴 Pedido dele (10/09): "se o usuário começa a digitar um formulário das
 * configurações e sai pra ir em outra tela, sem terminar, esse dado não some ao
 * voltar".
 *
 * A causa é o roteador: a tela continua MONTADA na pilha ao navegar, então o
 * `useState` sobrevive. Voltar depois mostra o que foi digitado antes — e em
 * "Dados cadastrais" isso inclui a **senha atual e a nova**, que ficam vivas na
 * memória do app por tempo indefinido. Não é só desperdício: é dado sensível
 * esperando.
 *
 * Limpa ao SAIR, e não ao voltar, de propósito: quem volta encontra a tela
 * limpa, sem ver o próprio texto sumir na frente.
 */
export function useLimparAoSair(limpar: () => void) {
  const focado = useIsFocused();
  const estavaFocado = useRef(focado);
  // Ref para a função porque quem chama passa uma arrow nova a cada render, e
  // depender dela reexecutaria o efeito sem que nada tenha mudado. A escrita
  // acontece DENTRO de um efeito: mexer em ref durante o render é proibido
  // (react-hooks/refs) — o render tem que poder rodar duas vezes sem efeito
  // colateral.
  const limparRef = useRef(limpar);
  useEffect(() => {
    limparRef.current = limpar;
  }, [limpar]);

  useEffect(() => {
    if (estavaFocado.current && !focado) limparRef.current();
    estavaFocado.current = focado;
  }, [focado]);
}
