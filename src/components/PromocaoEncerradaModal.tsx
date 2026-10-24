import { Text } from "react-native";

import { NwButton } from "@components/nw/Button";
import { ModalBase } from "@components/ModalBase";

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
  const t = motivo ? TEXTOS[motivo] : null;
  return (
    <ModalBase
      visible={motivo !== null}
      aoFechar={aoFechar}
      titulo={t?.titulo}
      tituloTestID="promocao-modal-titulo"
      testID="promocao-modal"
      rodape={<NwButton title="Entendi" onPress={aoFechar} testID="promocao-modal-fechar" />}
    >
      <Text className="font-body text-sm text-vupth-textSecondary">{t?.corpo}</Text>
    </ModalBase>
  );
}
