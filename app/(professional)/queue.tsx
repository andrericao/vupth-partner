import { useState, useCallback, useEffect, useRef } from "react";
import {
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  BadgeText,
  Pressable,
  ScrollView,
  Spinner,
} from "@gluestack-ui/themed";
import { Alert, RefreshControl, BackHandler } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { Button } from "@components/Button";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { useElapsedTime } from "@hooks/useElapsedTime";
import { useAttendanceStore } from "@store/attendance.store";
import { useProfessionalStore } from "@store/professional.store";
import { useIntervalStore, mealName, type Interval } from "@store/interval.store";
import type { AttendanceInQueue } from "@lib/types";
import { getApiErrorMessage } from "@lib/api";
import { parseApiTime, isoDate } from "@lib/time";
import * as SecureStore from "expo-secure-store";

// Janela (min) apos o horario previsto em que ainda vale avisar do almoco.
const MEAL_NUDGE_WINDOW_MIN = 45;

// [new-design] Sombra suave para os cards (RN style, cross-platform).
const cardShadow = {
  shadowColor: "#1B4332",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.14,
  shadowRadius: 10,
  elevation: 3,
};

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

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

  const intervals = useIntervalStore((s) => s.intervals);
  const fetchIntervals = useIntervalStore((s) => s.fetchIntervals);
  const startInterval = useIntervalStore((s) => s.startInterval);
  const finishInterval = useIntervalStore((s) => s.finishInterval);
  const meals = intervals.filter((i) => i.type === "RECURRENT");

  // Anti-nag: refeicoes ja avisadas nesta sessao (nao repetir o popup).
  const nudgedRef = useRef<Set<string>>(new Set());

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => handler.remove();
  }, []);

  useEffect(() => {
    if (!establishmentId) {
      useProfessionalStore.getState().fetchMe().catch(() => {});
    }
  }, [establishmentId]);

  // Carrega as refeicoes do dia ao montar (e quando o profissional muda).
  const profId = professional?.id;
  useEffect(() => {
    if (profId && establishmentId) fetchIntervals(profId).catch(() => {});
  }, [profId, establishmentId, fetchIntervals]);

  const handleStartMeal = useCallback(
    async (m: Interval) => {
      if (!profId) return;
      try {
        await startInterval(profId, m.intervalId);
      } catch (error: any) {
        Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel iniciar a refeicao."));
      }
    },
    [profId, startInterval]
  );

  // Nudge do almoco/janta: so avisa DENTRO de uma janela curta apos o horario
  // previsto (nao o dia inteiro) e no maximo UMA vez por refeicao/dia
  // (persistido em SecureStore — antes reaparecia a cada abertura do app).
  useEffect(() => {
    if (!profId) return;
    let cancelled = false;

    (async () => {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const today = isoDate(now);

      const due = meals.find((m) => {
        if (m.status !== "SCHEDULED") return false;
        const t = parseApiTime(m.fixedStartTime);
        if (!t) return false;
        const tMin = hhmmToMinutes(t);
        return (
          nowMin >= tMin &&
          nowMin <= tMin + MEAL_NUDGE_WINDOW_MIN &&
          !nudgedRef.current.has(m.intervalId)
        );
      });
      if (!due) return;

      nudgedRef.current.add(due.intervalId);
      const key = `meal_nudge_${due.intervalId}`;
      const last = await SecureStore.getItemAsync(key);
      if (cancelled || last === today) return; // ja avisou hoje
      await SecureStore.setItemAsync(key, today);

      const count = data?.professionals?.find((p) => p.id === profId)?.queue_count ?? 0;
      Alert.alert(
        `Hora do ${mealName(due.description)}`,
        count > 0
          ? `Voce tem ${count} cliente(s) na fila. Iniciar agora adia o proximo em ~${due.durationMinutes}min.`
          : `Iniciar ${mealName(due.description)} agora (${due.durationMinutes}min)?`,
        [
          { text: "Agora nao", style: "cancel" },
          { text: "Iniciar agora", onPress: () => handleStartMeal(due) },
        ]
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [meals, profId, data, handleStartMeal]);

  const myProfessional = data?.professionals?.find((p) => p.id === professional?.id);
  const currentAttendance = myProfessional?.current_attendance;
  const waitingList = myProfessional?.waiting_list ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    if (profId) await fetchIntervals(profId).catch(() => {});
    setRefreshing(false);
  }, [refetch, profId, fetchIntervals]);

  const handleAction = async (action: () => Promise<any>) => {
    try {
      await action();
      await refetch();
      // Iniciar um atendimento encerra a refeicao ativa no backend — refletir.
      if (profId) await fetchIntervals(profId).catch(() => {});
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Erro ao executar acao."));
    }
  };

  const handleFinishMeal = async (m: Interval) => {
    if (!profId) return;
    try {
      await finishInterval(profId, m.intervalId);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel encerrar a refeicao."));
    }
  };

  // Editar refeicao: confirmacao para nao abrir por toque acidental.
  const handleEditMeal = (m: Interval) => {
    Alert.alert(
      "Editar refeicao",
      `Abrir a edicao de "${mealName(m.description)}" (horario/duracao)?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Editar", onPress: () => router.push("/(professional)/meals" as any) },
      ]
    );
  };

  if (!establishmentId) {
    return (
      <VStack flex={1} py="$12" px="$6">
        <Header />
        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Minha Fila
        </Heading>
        <VStack
          mt="$8"
          bg="$amber50"
          p="$5"
          borderRadius="$lg"
          borderWidth="$1"
          borderColor="$amber200"
          space="sm"
        >
          <Text fontFamily="$heading" fontWeight="$bold" color="$amber700">
            Voce ainda nao tem fila
          </Text>
          <Text fontFamily="$body" color="$amber700">
            Para receber clientes, voce precisa estar vinculado a um
            estabelecimento. Busque um estabelecimento e solicite a vinculacao —
            o dono confirma e voce passa a aparecer na fila.
          </Text>
          <Button
            title="Buscar Estabelecimento"
            onPress={() => router.push("/(professional)/find-establishment" as any)}
            bg="$green500"
            $active-bg="$green600"
            mt="$2"
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
      <VStack flex={1} py="$12" px="$6">
        <Header />

        <Heading size="2xl" fontFamily="$heading" mt="$4">
          Minha fila
        </Heading>

        {/* [new-design] 2 cards verdes: pessoas na fila + tempo de espera (sem "~"). */}
        {myProfessional && (
          <HStack space="md" mt="$4">
            <VStack flex={1} bg="$green500" p="$4" borderRadius="$2xl" style={cardShadow}>
              <Text fontFamily="$body" fontSize="$xs" color="$green50">
                pessoas na fila
              </Text>
              <Text fontFamily="$heading" fontSize="$4xl" color="$white" mt="$1">
                {myProfessional.queue_count}
              </Text>
            </VStack>
            <VStack flex={1} bg="$green500" p="$4" borderRadius="$2xl" style={cardShadow}>
              <Text fontFamily="$body" fontSize="$xs" color="$green50">
                tempo de espera
              </Text>
              <Text fontFamily="$heading" fontSize="$3xl" color="$white" mt="$1">
                {myProfessional.estimated_wait_minutes} min
              </Text>
            </VStack>
          </HStack>
        )}

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

        {myProfessional && meals.length > 0 && (
          <VStack mt="$6">
            <Text fontFamily="$heading" fontWeight="$bold" mb="$2" color="$coolGray700">
              Refeicoes
            </Text>
            {meals.map((m) => {
              const active = m.status === "ACTIVE";
              return (
                <HStack
                  key={m.intervalId}
                  bg={active ? "$amber100" : "$amber50"}
                  p="$3"
                  mb="$2"
                  borderRadius="$2xl"
                  borderWidth="$1"
                  borderColor={active ? "$amber300" : "$amber200"}
                  alignItems="center"
                  space="sm"
                >
                  <Text fontSize="$md">🍽️</Text>
                  <VStack flex={1}>
                    <Text fontFamily="$heading" fontWeight="$bold" color="$amber700">
                      {mealName(m.description)} {parseApiTime(m.fixedStartTime) ?? "--:--"}
                    </Text>
                    <Text fontFamily="$body" fontSize="$xs" color="$amber600">
                      {m.durationMinutes}min{active ? " • em andamento" : " • previsto"}
                    </Text>
                  </VStack>
                  {!active && (
                    <Pressable onPress={() => handleEditMeal(m)} px="$2" py="$1">
                      <Text fontSize="$lg" color="$amber700">✎</Text>
                    </Pressable>
                  )}
                  {active ? (
                    <Button
                      title="Encerrar"
                      onPress={() => handleFinishMeal(m)}
                      bg="$amber500"
                      $active-bg="$amber600"
                      h="$9"
                      mt="$0"
                    />
                  ) : (
                    <Button
                      title="Iniciar"
                      onPress={() => handleStartMeal(m)}
                      bg="$green500"
                      $active-bg="$green600"
                      h="$9"
                      mt="$0"
                    />
                  )}
                </HStack>
              );
            })}
          </VStack>
        )}

        {myProfessional && (
          <Button
            title="Adicionar Cliente"
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

        {/* Vinculado, mas o backend nao o lista na fila por nao ter servico:
            sem isto a tela ficava em branco. Damos a acao de adicionar servico. */}
        {!isLoading && data && !myProfessional && (
          <VStack
            mt="$8"
            bg="$amber50"
            p="$5"
            borderRadius="$lg"
            borderWidth="$1"
            borderColor="$amber200"
            space="sm"
          >
            <Text fontFamily="$heading" fontWeight="$bold" color="$amber700">
              Voce ainda nao aparece para os clientes
            </Text>
            <Text fontFamily="$body" color="$amber700">
              Voce esta vinculado, mas precisa de pelo menos um servico cadastrado
              para entrar na fila e receber clientes.
            </Text>
            <Button
              title="Adicionar Servico"
              onPress={() => router.push("/(professional)/my-services" as any)}
              bg="$green500"
              $active-bg="$green600"
              mt="$2"
            />
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
