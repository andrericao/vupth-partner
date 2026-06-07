import { useState, useCallback, useEffect } from "react";
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
import { Alert, RefreshControl, BackHandler } from "react-native";
import { router } from "expo-router";
import { Button } from "@components/Button";
import { Header } from "@components/Header";
import { useEstablishmentStore } from "@store/establishment.store";
import { useAuthStore } from "@store/auth.store";
import { useQueuePolling } from "@hooks/useQueuePolling";

export default function OwnerDashboardScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const updateOpenStatus = useEstablishmentStore((s) => s.updateOpenStatus);
  const logout = useAuthStore((s) => s.logout);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => handler.remove();
  }, []);

  const isOpen = establishment?.open_status === "OPEN";
  const { data: queueData, refetch } = useQueuePolling(establishment?.id ?? null);
  const totalInQueue = queueData?.total_in_queue ?? 0;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

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

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)" as any);
        },
      },
    ]);
  };

  if (!establishment) {
    return (
      <VStack flex={1} pb="$6" px="$6">
        <Header />
        <VStack flex={1} alignItems="center" justifyContent="center">
          <Text fontFamily="$body" color="$coolGray500">
            Nenhum estabelecimento encontrado.
          </Text>
          <Button
            title="Criar Estabelecimento"
            onPress={() => router.push("/(owner)/onboarding/establishment" as any)}
          />
        </VStack>
      </VStack>
    );
  }

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <VStack flex={1} pb="$6" px="$6">
        <Header />

        <HStack justifyContent="space-between" alignItems="center" mt="$4">
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

        {isOpen && (
          <HStack mt="$4" space="md">
            <VStack flex={1} bg="$green50" p="$3" borderRadius="$lg" borderWidth="$1" borderColor="$green200">
              <Text fontFamily="$body" fontSize="$xs" color="$green700">Na fila</Text>
              <Text fontFamily="$heading" fontWeight="$bold" fontSize="$2xl" color="$green800">
                {totalInQueue}
              </Text>
            </VStack>
            <VStack flex={1} bg="$blue50" p="$3" borderRadius="$lg" borderWidth="$1" borderColor="$blue200">
              <Text fontFamily="$body" fontSize="$xs" color="$blue700">Profissionais</Text>
              <Text fontFamily="$heading" fontWeight="$bold" fontSize="$2xl" color="$blue800">
                {queueData?.available_professionals ?? 0}
              </Text>
            </VStack>
          </HStack>
        )}

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
          title="Ver Filas"
          onPress={() =>
            router.push({
              pathname: "/(owner)/queues",
              params: { establishmentId: establishment.id },
            } as any)
          }
          bg="$amber500"
          $active-bg="$amber600"
        />

        <Button
          title="Atendimentos"
          onPress={() => router.push("/(owner)/attendances" as any)}
          bg="$cyan600"
          $active-bg="$cyan700"
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
          title="Endereco"
          onPress={() => router.push("/(owner)/onboarding/address" as any)}
          bg="$cyan500"
          $active-bg="$cyan600"
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
