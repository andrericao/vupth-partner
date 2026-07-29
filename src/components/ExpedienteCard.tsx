import { View, Text, Pressable } from "react-native";
import { cardShadow } from "@lib/styles";
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
      <View className="bg-white p-4 rounded-2xl" style={cardShadow}>
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-body text-xs text-gray-500">Expediente</Text>
          <View className="bg-amber-100 rounded-full px-2 py-0.5">
            <Text className="text-[10px] text-amber-700">EM BREVE</Text>
          </View>
        </View>
        <Text className="font-heading text-xl text-gray-400">--:-- – --:--</Text>
      </View>
    </Pressable>
  );
}
