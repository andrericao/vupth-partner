import { View, Text, Pressable } from "react-native";
import { comingSoon } from "@components/comingSoon";

// S5 (stub; backend "Expediente nos relatorios") — mostrar o inicio/fim do
// expediente (HH:MM–HH:MM) nos relatorios do dono e do profissional. O backend
// ainda nao registra/exporta os eventos de abrir/fechar (ligado ao S1). UI
// pronta; ao ligar, trocar o placeholder pelos horarios reais. (Andre 2026-07-12.)
// Migrado p/ NativeWind (v2).
export function ExpedienteCard() {
  return (
    <Pressable
      className="mt-4"
      onPress={() =>
        comingSoon("O expediente (horário de abertura e fechamento) nos relatórios")
      }
    >
      <View className="bg-vupth-surface p-4 rounded-card">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-body text-xs text-vupth-textSecondary">Expediente</Text>
          <View className="bg-vupth-warning rounded-full px-2 py-0.5">
            <Text className="text-f10 text-vupth-forest">EM BREVE</Text>
          </View>
        </View>
        {/* [marca-vupth] Placeholder no textSecondary: a paleta nao tem um tom
            "muted" abaixo dele, e o selo EM BREVE acima ja diz que e stub. */}
        <Text className="font-heading text-xl text-vupth-textSecondary">--:-- – --:--</Text>
      </View>
    </Pressable>
  );
}
