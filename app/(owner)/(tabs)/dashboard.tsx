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
  Pressable,
} from "@gluestack-ui/themed";
import { Alert, RefreshControl, BackHandler } from "react-native";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { Button } from "@components/Button";
import { Header } from "@components/Header";
import { useEstablishmentStore } from "@store/establishment.store";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { getApiErrorMessage } from "@lib/api";
import type { ProfessionalWithQueue } from "@lib/types";

export default function OwnerDashboardScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const updateOpenStatus = useEstablishmentStore((s) => s.updateOpenStatus);
  const fetchMine = useEstablishmentStore((s) => s.fetchMine);
  const [isToggling, setIsToggling] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!establishment) {
      fetchMine().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!isFocused) return;
    const handler = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => handler.remove();
  }, [isFocused]);

  const isOpen = establishment?.open_status === "OPEN";
  const { data: queueData, refetch } = useQueuePolling(establishment?.id ?? null);
  const totalInQueue = queueData?.total_in_queue ?? 0;
  const professionals: ProfessionalWithQueue[] = queueData?.professionals ?? [];
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleToggleStatus = async () => {
    if (!establishment) return;

    if (!isOpen && queueData && professionals.length === 0) {
      Alert.alert(
        "Estabelecimento sem profissionais",
        "Para abrir o estabelecimento e necessario ter pelo menos um profissional vinculado com servicos cadastrados.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Adicionar Profissional",
            onPress: () =>
              router.push({
                pathname: "/(owner)/add-professional",
                params: { establishmentId: establishment.id },
              } as any),
          },
        ]
      );
      return;
    }

    setIsToggling(true);
    try {
      const newStatus = isOpen ? "CLOSED" : "OPEN";
      await updateOpenStatus(establishment.id, newStatus);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        getApiErrorMessage(
          error,
          `Nao foi possivel ${isOpen ? "fechar" : "abrir"} o estabelecimento. Tente novamente.`
        )
      );
    } finally {
      setIsToggling(false);
    }
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

        <Divider my="$6" />

        <Button
          title={isOpen ? "Fechar Estabelecimento" : "Abrir Estabelecimento"}
          onPress={handleToggleStatus}
          isLoading={isToggling}
          bg={isOpen ? "$red500" : "$green500"}
          $active-bg={isOpen ? "$red600" : "$green600"}
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

        <Divider my="$6" />

        <HStack justifyContent="space-between" alignItems="center" mb="$3">
          <Heading size="lg" fontFamily="$heading">
            Profissionais
          </Heading>
          <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
            {professionals.length} cadastrado{professionals.length !== 1 ? "s" : ""}
          </Text>
        </HStack>

        {professionals.length === 0 ? (
          <VStack bg="$coolGray50" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200" alignItems="center">
            <Text fontFamily="$body" color="$coolGray400" textAlign="center">
              Nenhum profissional vinculado
            </Text>
            <Button
              title="Adicionar Profissional"
              onPress={() =>
                router.push({
                  pathname: "/(owner)/add-professional",
                  params: { establishmentId: establishment.id },
                } as any)
              }
              bg="$green500"
              $active-bg="$green600"
              mt="$2"
              h="$10"
            />
          </VStack>
        ) : (
          <VStack space="sm">
            {professionals.map((prof) => (
              <Pressable
                key={prof.id}
                onPress={() =>
                  router.push({
                    pathname: "/(owner)/professional-queue",
                    params: {
                      professionalId: prof.id,
                      establishmentId: establishment.id,
                      professionalName: prof.name,
                    },
                  } as any)
                }
                bg="$white"
                py="$3"
                px="$4"
                borderRadius="$lg"
                borderWidth="$1"
                borderColor="$coolGray200"
                $active-bg="$coolGray50"
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <VStack flex={1}>
                    <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900">
                      {prof.name}
                    </Text>
                    <Text fontFamily="$body" fontSize="$xs" color="$coolGray500">
                      {prof.specialty ?? "Sem especialidade"}
                    </Text>
                  </VStack>
                  <VStack alignItems="flex-end">
                    <Badge
                      action={prof.queue_count > 0 ? "success" : "muted"}
                      variant="solid"
                      borderRadius="$md"
                    >
                      <BadgeText fontSize="$xs">{prof.queue_count} na fila</BadgeText>
                    </Badge>
                    <Text fontFamily="$body" fontSize="$xs" color={prof.is_available ? "$green500" : "$coolGray400"} mt="$1">
                      {prof.is_available ? "Disponivel" : "Indisponivel"}
                    </Text>
                  </VStack>
                </HStack>
              </Pressable>
            ))}
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
