import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, View, useWindowDimensions } from "react-native";

import { useTema } from "@hooks/useTema";

// modais-padding-e-rodape (Andre, 24/10): a caixa unica dos modais do Partner.
// Padrao: veu do tema, respiro lateral de 24, cartao com padding 24 e altura maxima
// de 85% da tela; titulo e corpo rolam juntos (conteudo longo ou teclado aberto nao
// empurram os botoes) e o rodape com os botoes fica FIXO embaixo, fora da rolagem.
// O teclado sobe a caixa inteira (KeyboardAvoidingView).
type Props = {
  visible: boolean;
  aoFechar: () => void;
  titulo: string | undefined;
  tituloTestID?: string;
  /** testID do cartao. */
  testID?: string;
  /** Os botoes, empilhados e fixos no pe do cartao. */
  rodape: ReactNode;
  children?: ReactNode;
};

export const ALTURA_MAXIMA_DO_MODAL = 0.85;

export function ModalBase({ visible, aoFechar, titulo, tituloTestID, testID, rodape, children }: Props) {
  const { veu } = useTema();
  const { height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={aoFechar}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center px-6"
        style={{ backgroundColor: veu }}
      >
        <View
          testID={testID}
          className="bg-vupth-painel rounded-card p-6"
          style={{ maxHeight: height * ALTURA_MAXIMA_DO_MODAL }}
        >
          <ScrollView
            testID="modal-corpo"
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ gap: 12 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text testID={tituloTestID} className="font-heading text-lg text-vupth-textPrimary">
              {titulo}
            </Text>
            {children}
          </ScrollView>
          <View testID="modal-rodape" className="gap-3 pt-3">
            {rodape}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
