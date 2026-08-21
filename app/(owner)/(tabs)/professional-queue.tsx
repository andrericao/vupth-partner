import { useState, useCallback } from "react";
import {
  VStack,
  HStack,
  Text,
  Badge,
  BadgeText,
  ScrollView,
  Spinner,
  Divider,
} from "@gluestack-ui/themed";
import { Alert, RefreshControl } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { Button } from "@components/Button";
import { useElapsedTime } from "@hooks/useElapsedTime";
import { useProfessionalQueue } from "@hooks/useProfessionalQueue";
import { useEstablishmentStore } from "@store/establishment.store";
import { getApiErrorMessage } from "@lib/api";
import type { AttendanceInQueue } from "@lib/types";

function QueueItem({ attendance, position }: { attendance: AttendanceInQueue; position: number }) {
  const statusLabel =
    attendance.status === "IN_PROGRESS"
      ? "Atendendo"
      : attendance.status === "PAUSED"
        ? "Pausado"
        : `#${position}`;
  const statusColor =
    attendance.status === "IN_PROGRESS"
      ? "$forest"
      : attendance.status === "PAUSED"
        ? "$brandWarning"
        : "$forest";

  return (
    <HStack
      py="$3"
      px="$4"
      bg="$brandSurface"
      borderRadius="$card"
      mb="$2"
      justifyContent="space-between"
      alignItems="center"
    >
      <VStack flex={1}>
        <Text fontFamily="$heading" fontWeight="$bold" color="$forest">
          {attendance.clientName}
        </Text>
        <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary">
          {attendance.services.map((s) => s.customName).join(", ")}
        </Text>
      </VStack>
      <VStack alignItems="flex-end">
        <Text fontFamily="$body" fontSize="$sm" color={statusColor} fontWeight="$bold">
          {statusLabel}
        </Text>
        <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary">
          R$ {attendance.totalValue.toFixed(2)}
        </Text>
      </VStack>
    </HStack>
  );
}

function CurrentAttendanceCard({ attendance }: { attendance: any }) {
  const { formatted } = useElapsedTime(
    attendance.id ?? null,
    attendance.startTime ?? null,
    attendance.isPaused ?? false
  );

  return (
    <VStack
      bg="$greenTint"
      p="$4"
      borderRadius="$card"
      borderWidth="$1"
      borderColor="$greenTint"
      mb="$4"
    >
      <HStack justifyContent="space-between" alignItems="center">
        <Text fontFamily="$heading" fontWeight="$bold" color="$forest" fontSize="$lg">
          {attendance.clientName}
        </Text>
        <Badge action="success" variant="solid" borderRadius="$md">
          <BadgeText fontSize="$xs">
            {attendance.isPaused ? "PAUSADO" : "ATENDENDO"}
          </BadgeText>
        </Badge>
      </HStack>
      <Text fontFamily="$body" fontSize="$sm" color="$forest" mt="$1">
        {attendance.services?.map((s: any) => s.customName).join(", ")}
      </Text>
      <HStack mt="$2" justifyContent="space-between">
        <Text fontFamily="$body" fontSize="$sm" color="$forest">
          Tempo: {formatted}
        </Text>
        <Text fontFamily="$heading" fontWeight="$bold" color="$forest">
          R$ {(attendance.totalValue ?? 0).toFixed(2)}
        </Text>
      </HStack>
    </VStack>
  );
}

export default function ProfessionalQueueScreen() {
  const { professionalId, establishmentId, professionalName } = useLocalSearchParams<{
    professionalId: string;
    establishmentId: string;
    professionalName: string;
  }>();

  const { data, isLoading, refetch } = useProfessionalQueue(
    professionalId ?? null,
    establishmentId ?? null
  );

  const [refreshing, setRefreshing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const removeProfessional = useEstablishmentStore((s) => s.removeProfessional);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleRemove = () => {
    if (!establishmentId || !professionalId) return;
    const name = data?.professionalName ?? professionalName ?? "este profissional";
    Alert.alert(
      "Desvincular profissional",
      `Deseja desvincular ${name} do estabelecimento? Ele deixará de atender aqui.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desvincular",
          style: "destructive",
          onPress: async () => {
            setIsRemoving(true);
            try {
              await removeProfessional(establishmentId, professionalId);
              Alert.alert("Desvinculado", `${name} foi removido do estabelecimento.`, [
                { text: "OK", onPress: () => router.navigate("/(owner)/dashboard" as any) },
              ]);
            } catch (error: any) {
              Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível desvincular o profissional. Verifique se não há atendimento em andamento."));
            } finally {
              setIsRemoving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <VStack flex={1} pb="$12" px="$4">
        <ScreenHeader
          title={data?.professionalName ?? professionalName ?? "Fila"}
          onBack={() => router.navigate("/(owner)/dashboard" as any)}
        />

        {data && (
          <>
            <Text fontFamily="$body" color="$brandTextSecondary" mt="$1">
              {data.establishmentName}
            </Text>

            <HStack mt="$4" space="md" mb="$4">
              <VStack flex={1} bg="$greenTint" p="$3" borderRadius="$card" borderWidth="$1" borderColor="$greenTint">
                <Text fontFamily="$body" fontSize="$xs" color="$forest">Na fila</Text>
                <Text fontFamily="$heading" fontWeight="$bold" fontSize="$2xl" color="$forest">
                  {data.size}
                </Text>
              </VStack>
              <VStack flex={1} bg="$greenTint" p="$3" borderRadius="$card" borderWidth="$1" borderColor="$blue200">
                <Text fontFamily="$body" fontSize="$xs" color="$blue700">Espera total</Text>
                <Text fontFamily="$heading" fontWeight="$bold" fontSize="$2xl" color="$forest">
                  {data.totalRemainingMinutes} min
                </Text>
              </VStack>
            </HStack>

            <Divider mb="$4" />
          </>
        )}

        {isLoading && !data && (
          <VStack flex={1} alignItems="center" justifyContent="center" mt="$12">
            <Spinner color="$forest" size="large" />
            <Text fontFamily="$body" color="$brandTextSecondary" mt="$4">Carregando fila...</Text>
          </VStack>
        )}

        {data?.inAttendance && (
          <VStack mb="$2">
            <Text fontFamily="$heading" fontWeight="$bold" mb="$2" color="$brandTextSecondary">
              Em Atendimento
            </Text>
            <CurrentAttendanceCard attendance={data.inAttendance} />
          </VStack>
        )}

        {data && data.attendancesInQueue.length > 0 && (
          <VStack>
            <Text fontFamily="$heading" fontWeight="$bold" mb="$2" color="$brandTextSecondary">
              Lista de Espera ({data.attendancesInQueue.length})
            </Text>
            {data.attendancesInQueue.map((att, i) => (
              <QueueItem key={att.id} attendance={att} position={i + 1} />
            ))}
          </VStack>
        )}

        {data && !data.inAttendance && data.attendancesInQueue.length === 0 && (
          <VStack flex={1} alignItems="center" justifyContent="center" mt="$12">
            <Text fontFamily="$body" color="$brandTextSecondary" textAlign="center" fontSize="$lg">
              Nenhum cliente na fila
            </Text>
          </VStack>
        )}

        <Divider my="$6" />

        <Button
          title="Desvincular profissional"
          onPress={handleRemove}
          isLoading={isRemoving}
          bg="transparent"
          borderWidth="$1"
          borderColor="$brandDanger"
          textColor="$brandDanger"
          $active-bg="$brandSurface"
        />
      </VStack>
    </ScrollView>
  );
}
