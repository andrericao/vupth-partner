import { Modal, View, Text } from "react-native";

import { NwButton } from "@components/nw/Button";
import { useTema } from "@hooks/useTema";

// DEC-124: duas mensagens distintas, no formato dos modais do app. Vale para
// cupom e link; a Design revisa depois.
export type MotivoDaPromocao = "ENCERRADA" | "ESGOTADA";

const TEXTOS: Record<MotivoDaPromocao, { titulo: string; corpo: string }> = {
  ENCERRADA: {
    titulo: "Promoção encerrada",
    corpo: "O prazo desta promoção acabou. Quem não usou até lá perdeu o benefício.",
  },
  ESGOTADA: {
    titulo: "Promoção esgotada",
    corpo: "As vagas desta promoção acabaram.",
  },
};

type Props = {
  motivo: MotivoDaPromocao | null;
  aoFechar: () => void;
};

export function PromocaoEncerradaModal({ motivo, aoFechar }: Props) {
  const { veu } = useTema();
  const t = motivo ? TEXTOS[motivo] : null;
  return (
    <Modal visible={motivo !== null} transparent animationType="fade" onRequestClose={aoFechar}>
      <View className="flex-1 justify-center px-6" style={{ backgroundColor: veu }}>
        <View testID="promocao-modal" className="bg-vupth-painel rounded-card p-6 gap-3">
          <Text testID="promocao-modal-titulo" className="font-heading text-lg text-vupth-textPrimary">
            {t?.titulo}
          </Text>
          <Text className="font-body text-sm text-vupth-textSecondary">{t?.corpo}</Text>
          <NwButton title="Entendi" onPress={aoFechar} testID="promocao-modal-fechar" />
        </View>
      </View>
    </Modal>
  );
}
