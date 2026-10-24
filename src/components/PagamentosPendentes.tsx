import { useState } from "react";
import { View, Text } from "react-native";
import { NwButton } from "@components/nw/Button";
import { PendingDot } from "@components/PendingDot";
import { formatarReais, observacaoDoPagamento, type PagamentoPendente } from "@lib/pagamento";
import { avisoDeTeste, pagaPeloApp, type Gateway } from "@lib/gateway";

/**
 * pagamento-pix (Andre, 10/10): "Card do atendimento: status Pendente com uma
 * observacao embaixo ('Aguardando o cliente efetuar o pagamento' -> 'Confirme se
 * o pagamento foi efetuado' + dot), que some no confirmar". O "Recebi" vale nos
 * dois estados: o cliente pode ter pago sem tocar em "Ja paguei".
 */
export function PagamentosPendentes({
  itens,
  onRecebi,
  gateway,
}: {
  itens: PagamentoPendente[];
  onRecebi: (attendanceId: string) => Promise<void>;
  /** DEC-119: com o Asaas conectado, o webhook quita sozinho, mas o "Recebi" segue visivel. */
  gateway?: Gateway | null;
}) {
  const [confirmando, setConfirmando] = useState<string | null>(null);
  if (itens.length === 0) return null;

  async function recebi(id: string) {
    setConfirmando(id);
    try {
      await onRecebi(id);
    } finally {
      setConfirmando(null);
    }
  }

  return (
    <View testID="pagamentos-pendentes" className="mt-4 gap-3">
      <Text className="font-heading text-xl text-vupth-textPrimary">Pagamentos pendentes</Text>
      {avisoDeTeste(gateway) && (
        <View testID="pagamentos-faixa-teste" className="bg-vupth-warning px-3 py-2 rounded-card">
          <Text className="font-body text-xs text-vupth-onAccentPeach">{avisoDeTeste(gateway)}</Text>
        </View>
      )}
      {itens.map((p) => (
        <View key={p.attendance_id} className="bg-vupth-surface rounded-card p-4 gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-body text-sm font-semibold text-vupth-textPrimary">{p.client_name}</Text>
            <Text className="font-heading text-base text-vupth-textPrimary">{formatarReais(p.amount)}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            {p.status === "AWAITING_CONFIRMATION" && (
              <View testID={`pagamento-dot-${p.attendance_id}`}>
                <PendingDot />
              </View>
            )}
            <Text className="flex-1 font-body text-xs text-vupth-textSecondary">{observacaoDoPagamento(p.status)}</Text>
          </View>
          {/* pagamento-ja-recebi (Andre, 24/10): o "Recebi" fica SEMPRE visivel — o Asaas
              e a confirmacao manual quitam o mesmo atendimento e quem chega primeiro vence
              (o Backend cancela a cobranca do Asaas ao confirmar a mao). */}
          {pagaPeloApp(gateway, p.amount) && (
            <Text testID={`pelo-app-${p.attendance_id}`} className="font-body text-xs text-vupth-textSecondary">
              O app confirma o pagamento sozinho. Se já recebeu, toque em Recebi.
            </Text>
          )}
          <NwButton
            title="Recebi"
            variant="vupthOutline"
            className="h-12 self-start px-6"
            isLoading={confirmando === p.attendance_id}
            onPress={() => recebi(p.attendance_id)}
            testID={`recebi-${p.attendance_id}`}
            accessibilityLabel={`Recebi de ${p.client_name}`}
          />
        </View>
      ))}
    </View>
  );
}
