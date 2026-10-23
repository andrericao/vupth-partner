import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { meusCreditosDeCupom, type CreditosDeCupom as Creditos } from "@lib/campanhas";
import { formatarReais } from "@lib/dinheiro";

// cupom-ativado-em-configuracoes (BAK-1): o cliente usou cupom no corte; o
// profissional recebe o valor cheio e o desconto vira credito, pago no repasse.
type Props = { listar?: () => Promise<Creditos> };

function dia(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function CreditosDeCupom({ listar = meusCreditosDeCupom }: Props) {
  const [creditos, setCreditos] = useState<Creditos | null>(null);

  useEffect(() => {
    listar()
      .then(setCreditos)
      .catch(() => {});
  }, [listar]);

  if (!creditos || creditos.items.length === 0) return null;
  const proximo = dia(creditos.next_payout);

  return (
    <View className="mt-6 gap-2" testID="creditos-de-cupom">
      <Text className="font-body text-f11 font-bold tracking-wider text-vupth-textSecondary">CRÉDITO DE CUPOM</Text>
      <View className="bg-vupth-surface rounded-card px-4 py-3">
        <Text className="font-heading text-sm text-vupth-textPrimary" testID="creditos-aberto">
          {formatarReais(creditos.open_amount)} a receber
        </Text>
        {proximo && <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">repasse em {proximo}</Text>}
      </View>
      {creditos.items.map((i, n) => (
        <View key={`${i.attendance_id}-${n}`} testID="credito-item" className="bg-vupth-surface rounded-card px-4 py-3">
          <Text className="font-heading text-sm text-vupth-textPrimary">{i.campaign}</Text>
          <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">
            {[formatarReais(i.amount), i.paid_at ? "pago" : "a receber"].join(" · ")}
          </Text>
        </View>
      ))}
    </View>
  );
}
