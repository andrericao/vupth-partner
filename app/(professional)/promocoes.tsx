import { View, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { Cupom } from "@components/Cupom";
import { LinkDeIndicacao } from "@components/LinkDeIndicacao";

// cupom-no-app (DEC-61, DEC-63): Perfil → Promoções. O dono abre pela rota do
// grupo dele (from=owner), com as abas dele. Em cima, o link de indicacao
// (link-de-indicacao, DEC-70).
export default function PromocoesScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader
          title="Promoções"
          onBack={() =>
            router.navigate((from === "owner" ? "/(owner)/menu" : "/(professional)/settings") as any)
          }
        />
        <View className="mt-6">
          <LinkDeIndicacao />
          <Cupom />
        </View>
      </View>
    </ScrollView>
  );
}
