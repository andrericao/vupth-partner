import { useState } from "react";
import { View, Text } from "react-native";
import { NwButton } from "@components/nw/Button";
import { rotuloDoPagamento } from "@lib/pagamento";

/**
 * pagamento-pix (contrato 2a2b0ec, adendo 62295f1): o pagamento ao lado do
 * status, nos historicos. `onRecebi` so no do dono: o profissional confere pelo
 * card de Pagamentos pendentes do Relatorios.
 */
export function LinhaDoPagamento({
  status,
  onRecebi,
}: {
  status: string | null | undefined;
  onRecebi?: () => Promise<void>;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const rotulo = rotuloDoPagamento(status);
  if (!rotulo) return null;
  const pendente = status === "PENDING" || status === "AWAITING_CONFIRMATION";

  async function recebi() {
    setConfirmando(true);
    try {
      await onRecebi?.();
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <View className="flex-row items-center justify-between mt-2 gap-3">
      <Text className="flex-1 font-body text-xs text-vupth-textSecondary">Pagamento: {rotulo}</Text>
      {pendente && onRecebi && (
        <NwButton title="Recebi" variant="vupthOutline" className="h-12 px-6" isLoading={confirmando} onPress={recebi} />
      )}
    </View>
  );
}
