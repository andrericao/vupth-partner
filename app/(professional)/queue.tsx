import { useState, useCallback } from "react";
import {
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  BadgeText,
  ScrollView,
  Spinner,
} from "@gluestack-ui/themed";
import { Alert, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { Button } from "@components/Button";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { useElapsedTime } from "@hooks/useElapsedTime";
import { useAttendanceStore } from "@store/attendance.store";
import { useProfessionalStore } from "@store/professional.store";
import type { AttendanceInQueue } from "@lib/types";

function AttendanceCard({
  attendance,
  onStart,
  onFinish,
  onPause,
  onResume,
  onRemove,
  isActive,
}: {
  attendance: AttendanceInQueue;
  onStart?: () => void;
  onFinish?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onRemove?: () => void;
  isActive: boolean;
}) {
  const isInProgress = attendance.status === "IN_PROGRESS";
  const isPaused = attendance.status === "PAUSED";

  const { formatted } = useElapsedTime(
    isInProgress || isPaused ? (attendance as any).startTime ?? null : null,
    isPaused
  );

  const statusLabel = isInProgress
    ? "EM ATENDIMENTO"
    : isPaused
      ? "PAUSADO"
      : "AGUARDANDO";

  return (
    <VStack
      bg="$white"
      p="$4"
      borderRadius="$lg"
      borderWidth="$1"
      borderColor={isActive ? "$green300" : "$coolGray200"}
      mb="$3"
    >
      <HStack justifyContent="space-between" alignItems="center">
        <Text fontFamily="$heading" fontWeight="$bold" fontSize="$lg" color="$coolGray900">
          {attendance.clientName}
        </Text>
        <Badge
          action={isInProgress ? "success" : isPaused ? "warning" : "info"}
          variant="solid"
          borderRadius="$md"
        >
          <BadgeText fontSize="$xs">{statusLabel}</BadgeText>
        </Badge>
      </HStack>

      <VStack mt="$2" space="xs">
        {attendance.services.map((svc) => (
          <Text key={svc.id} fontFamily="$body" fontSize="$sm" color="$coolGray600">
            {svc.customName} ({svc.estimatedMinutes}min)
          </Text>
        ))}
      </VStack>

      <HStack mt="$3" justifyContent="space-between" alignItems="center">
        <Text fontFamily="$heading" fontWeight="$bold" color="$green700">
          R$ {attendance.totalValue.toFixed(2)}
        </Text>
        {(isInProgress || isPaused) && (
          <Text fontFamily="$body" fontSize="$sm" color={isInProgress ? "$green500" : "$amber500"}>
            {formatted}
          </Text>
        )}
      </HStack>

      {isActive && (isInProgress || isPaused) && (
        <HStack mt="$3" space="sm">
          {isInProgress && (
            <>
              <Button title="Pausar" onPress={onPause} bg="$amber500" $active-bg="$amber600" h="$10" flex={1} />
              <Button title="Finalizar" onPress={onFinish} bg="$green500" $active-bg="$green600" h="$10" flex={1} />
            </>
          )}
          {isPaused && (
            <Button title="Retomar" onPress={onResume} bg="$blue500" $active-bg="$blue600" h="$10" flex={1} />
          )}
        </HStack>
      )}

      {!isActive && attendance.status === "SCHEDULED" && (
        <HStack mt="$3" space="sm">
          <Button title="Iniciar" onPress={onStart} bg="$green500" $active-bg="$green600" h="$10" flex={1} />
          <Button title="Remover" onPress={onRemove} bg="$red400" $active-bg="$red500" h="$10" flex={1} />
        </HStack>
      )}
    </VStack>
  );
}

export default function ProfessionalQueueScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  const establishmentId = professional?.establishment_id;

  const { data, isLoading, refetch } = useQueuePolling(establishmentId ?? null);
  const { startAttendance, finishAttendance, pauseAttendance, resumeAttendance, removeFromQueue } =
    useAttendanceStore();

  const [refreshing, setRefreshing] = useState(false);

  const myProfessional = data?.professionals?.find((p) => p.id === professional?.id);
  const currentAttendance = myProfessional?.current_attendance;
  const waitingList = myProfessional?.waiting_list ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAction = async (action: () => Promise<any>) => {
    try {
      await action();
      await refetch();
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? "Erro ao executar acao.";
      Alert.alert("Erro", msg);
    }
  };

  if (!establishmentId) {
    return (
      <VStack flex={1} py="$12" px="$6" alignItems="center" justifyContent="center">
        <Header />
        <Text fontFamily="$body" color="$coolGray500" textAlign="center" mt="$12">
          Voce nao esta vinculado a nenhum estabelecimento.
        </Text>
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
      <VStack flex={1} py="$12" px="$6">
        <Header />

        <HStack mt="$4" justifyContent="space-between" alignItems="center">
          <Heading size="2xl" fontFamily="$heading">
            Minha Fila
          </Heading>
          {myProfessional && (
            <Badge action="success" variant="solid" borderRadius="$md">
              <BadgeText>{myProfessional.queue_count} na fila</BadgeText>
            </Badge>
          )}
        </HStack>

        {isLoading && !data && (
          <VStack flex={1} alignItems="center" justifyContent="center" mt="$12">
            <Spinner color="$green500" size="large" />
            <Text fontFamily="$body" color="$coolGray500" mt="$4">Carregando fila...</Text>
          </VStack>
        )}

        {currentAttendance && (
          <VStack mt="$6">
            <Text fontFamily="$heading" fontWeight="$bold" mb="$2" color="$coolGray700">
              Atendimento Atual
            </Text>
            <AttendanceCard
              attendance={currentAttendance}
              isActive
              onFinish={() => handleAction(() => finishAttendance(currentAttendance.id))}
              onPause={() => handleAction(() => pauseAttendance(currentAttendance.id))}
              onResume={() => handleAction(() => resumeAttendance(currentAttendance.id))}
            />
          </VStack>
        )}

        {waitingList.length > 0 && (
          <VStack mt="$6">
            <Text fontFamily="$heading" fontWeight="$bold" mb="$2" color="$coolGray700">
              Lista de Espera ({waitingList.length})
            </Text>
            {waitingList.map((att) => (
              <AttendanceCard
                key={att.id}
                attendance={att}
                isActive={false}
                onStart={() => handleAction(() => startAttendance(att.id))}
                onRemove={() =>
                  Alert.alert("Remover da fila", `Remover ${att.clientName}?`, [
                    { text: "Cancelar" },
                    { text: "Remover", style: "destructive", onPress: () => handleAction(() => removeFromQueue(att.id)) },
                  ])
                }
              />
            ))}
          </VStack>
        )}

        {myProfessional && (
          <Button
            title="Adicionar Walk-in"
            onPress={() => router.push("/(professional)/add-guest" as any)}
            bg="$amber500"
            $active-bg="$amber600"
            mt="$6"
          />
        )}

        {!isLoading && myProfessional && !currentAttendance && waitingList.length === 0 && (
          <VStack flex={1} alignItems="center" justifyContent="center" mt="$6">
            <Text fontFamily="$body" color="$coolGray400" textAlign="center" fontSize="$lg">
              Nenhum cliente na fila
            </Text>
            <Text fontFamily="$body" color="$coolGray300" textAlign="center" mt="$2">
              Novos clientes aparecerao automaticamente
            </Text>
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
