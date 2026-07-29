import { View, Text, ScrollView } from "react-native";
import { Header } from "@components/Header";

// Placeholder de tela ainda nao implementada. Migrado p/ NativeWind (v2);
// mantem a API (title/onBack).
type Props = {
  title: string;
  onBack?: () => void;
};

export function ComingSoon({ title, onBack }: Props) {
  return (
    <ScrollView
      className="w-full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 py-12 px-6">
        <Header showBackButton onBack={onBack} />

        <Text className="font-heading text-2xl mt-8 text-gray-900">{title}</Text>

        <View className="flex-1 items-center justify-center mt-12">
          <Text className="text-6xl">🚧</Text>
          <Text className="font-heading text-lg text-gray-700 mt-4 text-center">
            Em desenvolvimento
          </Text>
          <Text className="font-body text-gray-500 mt-2 text-center">
            Esta funcionalidade ainda falta implementar.{"\n"}Em breve estara
            disponivel.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
