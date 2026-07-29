import { View, Text } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { NwButton } from "@components/nw/Button";

export default function RoleChoiceScreen() {
  return (
    <View className="flex-1 py-12 px-6 items-center justify-center">
      <Header />

      <View className="flex-1 mt-48 w-full gap-5">
        <Text className="font-heading text-3xl text-center text-gray-900">
          Como deseja usar o VUPTH?
        </Text>

        <Text className="font-body text-center mt-4 text-gray-500">
          Escolha seu papel para começar
        </Text>

        <NwButton
          title="Sou dono de estabelecimento"
          onPress={() => router.push("/(auth)/register?role=owner")}
          className="mt-8"
        />

        <NwButton
          title="Sou profissional"
          variant="outlineBrand"
          onPress={() => router.push("/(auth)/register?role=professional")}
          className="mt-4"
        />
      </View>
    </View>
  );
}
