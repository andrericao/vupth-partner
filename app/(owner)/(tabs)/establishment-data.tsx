import {
  VStack,
  HStack,
  Heading,
  Text,
  Pressable,
  ScrollView,
} from "@gluestack-ui/themed";
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
      py="$4"
      px="$5"
      bg="$white"
      borderRadius="$2xl"
      style={cardShadow}
      $active-bg="$coolGray50"
    >
      <Text fontFamily="$heading" fontWeight="$bold" fontSize="$md" color="$coolGray900">
        {label}
      </Text>
      <Text fontFamily="$body" fontSize="$sm" color="$coolGray500" mt="$0.5">
        {description}
      </Text>
    </Pressable>
  );
}

export default function EstablishmentDataScreen() {
  // Checklist de prontidao (2 completes) mora aqui, nas Configuracoes — a Home
  // so mostra a faixa. Ver useOwnerCompletion / CompletionCard.
  const { completion, professionalsCount, routeFor } = useOwnerCompletion();

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton onBack={() => router.navigate("/(owner)/menu" as any)} />

        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Dados do Estabelecimento
        </Heading>

        <CompletionCard
          completion={completion}
          doneBanner="Cadastro completo — já pode abrir a loja e atender!"
          routeFor={routeFor}
        />

        <VStack mt="$6" space="sm">
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
        </VStack>

        <HStack
          mt="$4"
          bg="$white"
          borderRadius="$2xl"
          px="$5"
          py="$4"
          justifyContent="space-between"
          alignItems="center"
          style={cardShadow}
        >
          <Text fontFamily="$body" fontSize="$md" color="$coolGray700">
            Profissionais vinculados
          </Text>
          <Text fontFamily="$heading" fontWeight="$bold" fontSize="$lg" color="$green700">
            {professionalsCount}
          </Text>
        </HStack>
      </VStack>
    </ScrollView>
  );
}
