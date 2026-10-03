import { View, Text } from "react-native";
import type { Periodo } from "@hooks/useRelatorioDoPeriodo";
import { resumoDoExpediente, type DiaDeExpediente } from "@lib/expediente";

// Expediente nos relatorios do dono e do profissional (S4/S5; contrato do
// Backend de 03/10). Hoje mostra a faixa HH:MM–HH:MM; Semana/Mes, o total
// trabalhado. Sem dado (backend antigo ou dia antes do deploy): placeholder.
// Migrado p/ NativeWind (v2).
export function ExpedienteCard({
  periodo,
  workdays,
}: {
  periodo: Periodo;
  workdays?: DiaDeExpediente[] | null;
}) {
  const resumo = resumoDoExpediente(workdays, periodo);
  return (
    <View className="mt-4 bg-vupth-surface p-4 rounded-card">
      <Text className="font-body text-xs text-vupth-textSecondary mb-1">Expediente</Text>
      {resumo ? (
        <View className="flex-row items-baseline gap-2">
          <Text className="font-heading text-xl text-vupth-forest">{resumo.valor}</Text>
          {resumo.detalhe && (
            <Text className="font-body text-xs text-vupth-textSecondary">{resumo.detalhe}</Text>
          )}
        </View>
      ) : (
        // [marca-vupth] Placeholder no textSecondary: a paleta nao tem um tom
        // "muted" abaixo dele.
        <Text className="font-heading text-xl text-vupth-textSecondary">--:-- – --:--</Text>
      )}
    </View>
  );
}
