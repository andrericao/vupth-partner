import { useState } from "react";
import {
  VStack,
  Heading,
  Text,
  HStack,
  Badge,
  BadgeText,
  Divider,
  ScrollView,
} from "@gluestack-ui/themed";
import { Alert } from "react-native";
import { router } from "expo-router";
import { Button } from "@components/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { useAuthStore } from "@store/auth.store";

export default function OwnerDashboardScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const updateOpenStatus = useEstablishmentStore((s) => s.updateOpenStatus);
  const logout = useAuthStore((s) => s.logout);
  const [isToggling, setIsToggling] = useState(false);

  const isOpen = establishment?.open_status === "OPEN";

  const handleToggleStatus = async () => {
    if (!establishment) return;

    setIsToggling(true);
    try {
      const newStatus = isOpen ? "CLOSED" : "OPEN";
      await updateOpenStatus(establishment.id, newStatus);
    } catch {
      Alert.alert("Erro", "Não foi possível atualizar o status.");
    } finally {
      setIsToggling(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)" as any);
  };

  if (!establishment) {
    return (
      <VStack flex={1} py="$12" px="$6" alignItems="center" justifyContent="center">
        <Text fontFamily="$body" color="$coolGray500">
          Nenhum estabelecimento encontrado.
        </Text>
        <Button
          title="Criar Estabelecimento"
          onPress={() => router.replace("/(owner)/onboarding/establishment" as any)}
        />
      </VStack>
    );
  }

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack flex={1} py="$12" px="$6">
        <HStack justifyContent="space-between" alignItems="center">
          <Heading size="2xl" fontFamily="$heading">
            {establishment.name}
          </Heading>
          <Badge
            action={isOpen ? "success" : "error"}
            variant="solid"
            borderRadius="$md"
          >
            <BadgeText>{isOpen ? "ABERTO" : "FECHADO"}</BadgeText>
          </Badge>
        </HStack>

        <Text fontFamily="$body" color="$coolGray500" mt="$2">
          {establishment.service_type}
        </Text>

        <Divider my="$6" />

        <Button
          title={isOpen ? "Fechar Estabelecimento" : "Abrir Estabelecimento"}
          onPress={handleToggleStatus}
          isLoading={isToggling}
          bg={isOpen ? "$red500" : "$green500"}
          $active-bg={isOpen ? "$red600" : "$green600"}
        />

        <Button
          title="Adicionar Profissional"
          onPress={() =>
            router.push({
              pathname: "/(owner)/add-professional",
              params: { establishmentId: establishment.id },
            } as any)
          }
          bg="$blue500"
          $active-bg="$blue600"
        />

        <Button
          title="Adicionar Serviço"
          onPress={() =>
            router.push({
              pathname: "/(owner)/add-service",
              params: { establishmentId: establishment.id },
            } as any)
          }
          bg="$purple500"
          $active-bg="$purple600"
        />

        <Button
          title="Sair"
          onPress={handleLogout}
          bg="$coolGray400"
          $active-bg="$coolGray500"
        />
      </VStack>
    </ScrollView>
  );
}
