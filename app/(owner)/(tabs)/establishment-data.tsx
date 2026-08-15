import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { CompletionCard } from "@components/CompletionCard";
import { useOwnerCompletion } from "@hooks/useOwnerCompletion";
import { cardShadow } from "@lib/styles";

type MenuItemProps = {
  label: string;
  description: string;
  onPress: () => void;
};

function MenuItem({ label, description, onPress }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="py-4 px-5 bg-white rounded-2xl active:bg-gray-50"
      style={cardShadow}
    >
      <Text className="font-heading text-base text-gray-900">{label}</Text>
      <Text className="font-body text-sm text-gray-500 mt-0.5">{description}</Text>
    </Pressable>
  );
}

export default function EstablishmentDataScreen() {
  // Checklist de prontidao (2 completes) mora aqui, nas Configuracoes — a Home
  // so mostra a faixa. Ver useOwnerCompletion / CompletionCard.
  const { completion, professionalsCount, routeFor } = useOwnerCompletion();

  return (
    <ScrollView
      className="w-full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 py-12 px-6">
        <Header showBackButton onBack={() => router.navigate("/(owner)/menu" as any)} />

        <Text className="font-heading text-2xl text-gray-900 mt-8">
          Dados do Estabelecimento
        </Text>

        <CompletionCard
          completion={completion}
          doneBanner="Cadastro completo — já pode abrir a loja e atender!"
          routeFor={routeFor}
        />

        <View className="mt-6 gap-2">
          <MenuItem
            label="Dados Cadastrais"
            description="Nome do estabelecimento"
            onPress={() => router.push("/(owner)/establishment-registration" as any)}
          />
          <MenuItem
            label="Horario de Funcionamento"
            description="Abertura e fechamento"
            onPress={() => router.push("/(owner)/establishment-hours" as any)}
          />
          <MenuItem
            label="Endereco"
            description="Rua, numero, bairro, CEP"
            onPress={() => router.push("/(owner)/onboarding/address" as any)}
          />
        </View>

        <View
          className="mt-4 bg-white rounded-2xl px-5 py-4 flex-row justify-between items-center"
          style={cardShadow}
        >
          <Text className="font-body text-base text-gray-700">
            Profissionais vinculados
          </Text>
          <Text className="font-heading text-lg text-brand-700">
            {professionalsCount}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
