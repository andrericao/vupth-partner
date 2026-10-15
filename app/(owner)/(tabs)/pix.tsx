import { View, ScrollView } from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { ChavePix } from "@components/ChavePix";

// pix-nas-configuracoes (PAR-9, DEC-65 · pix-por-pessoa; contrato do Backend
// 9def181): a chave e da PESSOA. O dono cadastra a dele pela mesma rota do
// profissional (/professional/me/pix aceita OWNER) — e a ALTERNATIVA: o cliente
// paga a chave do profissional que atendeu e, sem ela, a do dono.
export default function PixDoDonoScreen() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader
          title="Chave Pix (alternativa)"
          subtitle="Vale quando o profissional que atendeu não tem chave. Cada profissional cadastra a dele."
          onBack={() => router.navigate("/(owner)/menu" as any)}
        />
        <View className="mt-6">
          <ChavePix />
        </View>
      </View>
    </ScrollView>
  );
}
