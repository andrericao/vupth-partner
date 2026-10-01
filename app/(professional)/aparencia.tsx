import { View, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { Aparencia } from "@components/Aparencia";
import { rotaDeVoltaDosDados } from "@lib/routing";

// "Aparencia" — tema e tamanho da fonte (Andre, 26/09; o mesmo submenu do
// Client). Serve ao profissional (Perfil) e ao dono (Menu, from=owner).
export default function AparenciaScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader
          title="Aparência"
          subtitle="Tema e tamanho da fonte."
          onBack={() => router.navigate(rotaDeVoltaDosDados(from) as any)}
        />
        <View className="mt-6">
          <Aparencia />
        </View>
      </View>
    </ScrollView>
  );
}
