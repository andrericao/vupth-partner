import {
  VStack,
  Heading,
  Text,
  Pressable,
  ScrollView,
} from "@gluestack-ui/themed";
import { router } from "expo-router";
import { Header } from "@components/Header";

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
      px="$4"
      bg="$white"
      borderRadius="$md"
      borderWidth="$1"
      borderColor="$coolGray200"
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

        <VStack mt="$6" space="sm">
          <MenuItem
            label="Dados Cadastrais"
            description="Nome do estabelecimento"
            onPress={() => router.push("/(owner)/establishment-registration" as any)}
          />
          <MenuItem
            label="Endereco"
            description="Rua, numero, bairro, CEP"
            onPress={() => router.push("/(owner)/onboarding/address" as any)}
          />
        </VStack>
      </VStack>
    </ScrollView>
  );
}
