import { View, ScrollView } from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { QuantoCobrar } from "@components/QuantoCobrar";
import { useProfessionalStore } from "@store/professional.store";

// aba-de-custos: Relatorios -> "Quanto cobrar?". Calculo local, sem Backend.
export default function CustosScreen() {
  const servicos = useProfessionalStore((s) => s.myServices);
  return (
    <ScrollView className="flex-1 bg-vupth-background" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader title="Quanto cobrar?" onBack={() => router.navigate("/(professional)/my-day" as any)} />
        <View className="mt-4">
          <QuantoCobrar servicos={servicos} />
        </View>
      </View>
    </ScrollView>
  );
}
