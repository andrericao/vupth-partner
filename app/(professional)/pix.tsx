import { View, ScrollView } from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { ChavePix } from "@components/ChavePix";
import { useProfessionalStore } from "@store/professional.store";

// pagamento-pix (contrato do Backend 2a2b0ec): Perfil → Chave Pix.
export default function PixScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader
          title="Chave Pix"
          subtitle="O cliente paga direto a você."
          onBack={() => router.navigate("/(professional)/settings" as any)}
        />
        <View className="mt-6">
          <ChavePix nomeDaConta={professional?.name} />
        </View>
      </View>
    </ScrollView>
  );
}
