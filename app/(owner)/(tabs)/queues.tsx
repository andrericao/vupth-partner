import { useState, useCallback } from "react";
import {
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  BadgeText,
  ScrollView,
  Pressable,
  Divider,
  Spinner,
} from "@gluestack-ui/themed";
import { RefreshControl } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Header } from "@components/Header";
import { Button } from "@components/Button";
import { useQueuePolling } from "@hooks/useQueuePolling";
import type { ProfessionalWithQueue, AttendanceInQueue } from "@lib/types";

function AttendanceItem({ attendance }: { attendance: AttendanceInQueue }) {
  const statusLabel =
    attendance.status === "IN_PROGRESS"
      ? "Atendendo"
      : attendance.status === "PAUSED"
        ? "Pausado"
        : "Aguardando";
  const statusColor =
    attendance.status === "IN_PROGRESS"
      ? "$green500"
      : attendance.status === "PAUSED"
        ? "$amber500"
        : "$blue500";

  return (
    <HStack
      py="$2"
      px="$3"
      justifyContent="space-between"
      alignItems="center"
      borderBottomWidth="$1"
      borderBottomColor="$coolGray100"
    >
      <VStack flex={1}>
        <Text fontFamily="$body" fontSize="$sm" color="$coolGray900">
          {attendance.clientName}
        </Text>
        <Text fontFamily="$body" fontSize="$xs" color="$coolGray500">
          {attendance.services.map((s) => s.customName).join(", ")}
        </Text>
      </VStack>
      <VStack alignItems="flex-end">
        <Text fontFamily="$body" fontSize="$xs" color={statusColor}>
          {statusLabel}
        </Text>
        <Text fontFamily="$body" fontSize="$xs" color="$coolGray500">
          R$ {attendance.totalValue.toFixed(2)}
        </Text>
      </VStack>
    </HStack>
  );
}

function ProfessionalCard({ professional, establishmentId }: { professional: ProfessionalWithQueue; establishmentId: string }) {
  const [expanded, setExpanded] = useState(false);
  const allAttendances = [
    ...(professional.current_attendance ? [professional.current_attendance] : []),
    ...professional.waiting_list,
  ];

  return (
    <VStack bg="$white" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200" mb="$3" overflow="hidden">
      <Pressable onPress={() => setExpanded(!expanded)} py="$3" px="$4">
        <HStack justifyContent="space-between" alignItems="center">
          <VStack flex={1}>
            <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900">
              {professional.name}
            </Text>
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
              {professional.specialty ?? ""}
            </Text>
          </VStack>
          <VStack alignItems="flex-end">
            <Badge
              action={professional.queue_count > 0 ? "success" : "muted"}
              variant="solid"
              borderRadius="$md"
            >
              <BadgeText fontSize="$xs">{professional.queue_count} na fila</BadgeText>
            </Badge>
            <Text fontFamily="$body" fontSize="$xs" color="$coolGray500" mt="$1">
              {professional.estimated_wait_minutes} min
            </Text>
          </VStack>
        </HStack>
      </Pressable>

      {expanded && (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(owner)/professional-queue",
              params: {
                professionalId: professional.id,
                establishmentId,
                professionalName: professional.name,
              },
            } as any)
          }
          py="$2"
          px="$4"
          bg="$green50"
          borderTopWidth="$1"
          borderTopColor="$coolGray100"
        >
          <Text fontFamily="$body" fontSize="$sm" color="$green700" textAlign="center">
            Ver fila detalhada
          </Text>
        </Pressable>
      )}

      {expanded && allAttendances.length > 0 && (
        <VStack borderTopWidth="$1" borderTopColor="$coolGray100">
          {allAttendances.map((att) => (
            <AttendanceItem key={att.id} attendance={att} />
          ))}
        </VStack>
      )}

      {expanded && allAttendances.length === 0 && (
        <VStack py="$3" px="$4" borderTopWidth="$1" borderTopColor="$coolGray100">
          <Text fontFamily="$body" fontSize="$sm" color="$coolGray400" textAlign="center">
            Nenhum cliente na fila
          </Text>
        </VStack>
      )}
    </VStack>
  );
}

export default function OwnerQueuesScreen() {
  const { establishmentId } = useLocalSearchParams<{ establishmentId: string }>();
  const { data, isLoading, refetch } = useQueuePolling(establishmentId ?? null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const professionals = data?.professionals ?? [];

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton onBack={() => router.navigate("/(owner)/menu" as any)} />

        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Filas
        </Heading>

        {data && (
          <HStack mt="$4" space="md" mb="$4">
            <VStack flex={1} bg="$green50" p="$3" borderRadius="$lg" borderWidth="$1" borderColor="$green200">
              <Text fontFamily="$body" fontSize="$xs" color="$green700">Total na fila</Text>
              <Text fontFamily="$heading" fontWeight="$bold" fontSize="$2xl" color="$green800">
                {data.total_in_queue}
              </Text>
            </VStack>
            <VStack flex={1} bg="$blue50" p="$3" borderRadius="$lg" borderWidth="$1" borderColor="$blue200">
              <Text fontFamily="$body" fontSize="$xs" color="$blue700">Profissionais</Text>
              <Text fontFamily="$heading" fontWeight="$bold" fontSize="$2xl" color="$blue800">
                {data.available_professionals}
              </Text>
            </VStack>
          </HStack>
        )}

        <Divider mb="$4" />

        {isLoading && !data && (
          <VStack flex={1} alignItems="center" justifyContent="center" mt="$12">
            <Spinner color="$green500" size="large" />
            <Text fontFamily="$body" color="$coolGray500" mt="$4">Carregando filas...</Text>
          </VStack>
        )}

        {professionals.map((prof) => (
          <ProfessionalCard key={prof.id} professional={prof} establishmentId={establishmentId ?? ""} />
        ))}

        {!isLoading && professionals.length === 0 && (
          <VStack alignItems="center" mt="$12">
            <Text fontFamily="$body" color="$coolGray400" textAlign="center">
              Nenhum profissional cadastrado
            </Text>
            <Button
              title="Adicionar Profissional"
              onPress={() =>
                router.push({
                  pathname: "/(owner)/add-professional",
                  params: { establishmentId: establishmentId ?? "" },
                } as any)
              }
              bg="$green500"
              $active-bg="$green600"
              mt="$4"
            />
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
