import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { CompletionCard } from "@components/CompletionCard";
import { useOwnerCompletion } from "@hooks/useOwnerCompletion";

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
      className="py-4 px-4 bg-vupth-surface rounded-[20px] active:bg-gray-50"
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
      <View className="flex-1 py-12 px-4">
        <ScreenHeader
          title="Dados do Estabelecimento"
          onBack={() => router.navigate("/(owner)/menu" as any)}
        />

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
          className="mt-4 bg-vupth-surface rounded-[20px] px-4 py-4 flex-row justify-between items-center"
        >
          <Text className="font-body text-base text-gray-700">
            Profissionais vinculados
          </Text>
          <Text className="font-heading text-lg text-vupth-forest">
            {professionalsCount}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
