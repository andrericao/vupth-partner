import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";

import { useTema } from "@hooks/useTema";

// aba-de-custos: a porta da calculadora, em Relatorios. Cartao surface com
// titulo e seta (texto + seta, nao botao cheio), como no desenho da Design.
export function QuantoCobrarCard() {
  const { cores } = useTema();
  return (
    <Pressable
      testID="quanto-cobrar-card"
      accessibilityRole="button"
      accessibilityLabel="Quanto cobrar? Calcule o preço pelos seus custos"
      onPress={() => router.push("/(professional)/custos" as any)}
      className="mt-4 bg-vupth-surface p-4 rounded-card flex-row items-center active:opacity-80"
    >
      <View className="flex-1">
        <Text className="font-heading text-sm text-vupth-textPrimary">Quanto cobrar?</Text>
        <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">Calcule o preço pelos seus custos</Text>
      </View>
      <ChevronRight size={20} color={cores.textSecondary} />
    </Pressable>
  );
}
