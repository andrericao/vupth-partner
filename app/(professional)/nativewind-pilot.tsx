import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";

// PILOTO Gluestack v1->v2 (migracao faseada). Esta tela NAO usa @gluestack-ui/
// themed nem props $token — so React Native puro + `className` do NativeWind.
// Objetivo do QA: provar no device que (1) o app ainda builda com o toolchain
// NativeWind ligado e (2) as classes Tailwind realmente aplicam estilo.
// E descartavel: quando aprovarmos o padrao, seguimos convertendo tela por tela
// e removemos este arquivo + o card temporario em Configuracoes.
export default function NativeWindPilotScreen() {
  return (
    <ScrollView className="flex-1 bg-[#F7FAF8]">
      <View className="p-6 pt-16 gap-4">
        <Text className="text-2xl font-bold text-[#1B4332]">
          Piloto NativeWind
        </Text>
        <Text className="text-sm text-gray-500">
          Se voce ve cores, cantos arredondados e espacamentos aqui, o toolchain
          do Gluestack v2 (NativeWind) esta funcionando no device.
        </Text>

        {/* Cartao com sombra e borda arredondada via className */}
        <View className="bg-white rounded-2xl p-4 shadow-md gap-2">
          <Text className="text-base font-bold text-gray-900">Cartao</Text>
          <Text className="text-xs text-gray-500">
            bg-white · rounded-2xl · p-4 · shadow-md
          </Text>
        </View>

        {/* Paleta da marca (cores do tailwind.config) */}
        <View className="flex-row gap-2">
          <View className="flex-1 h-12 rounded-xl bg-brand items-center justify-center">
            <Text className="text-white text-xs font-bold">brand</Text>
          </View>
          <View className="flex-1 h-12 rounded-xl bg-amber-500 items-center justify-center">
            <Text className="text-white text-xs font-bold">amber</Text>
          </View>
          <View className="flex-1 h-12 rounded-xl bg-danger-500 items-center justify-center">
            <Text className="text-white text-xs font-bold">danger</Text>
          </View>
        </View>

        {/* Botao (Pressable) com estado de toque */}
        <Pressable
          accessibilityRole="button"
          className="bg-brand active:bg-[#1B4332] rounded-full py-3 items-center"
          onPress={() => router.navigate("/(professional)/settings" as any)}
        >
          <Text className="text-white font-bold">Voltar para Configuracoes</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
