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
} from "@gluestack-ui/themed";
import { Alert, RefreshControl, BackHandler, Modal } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { Button } from "@components/Button";
import { SkeletonList } from "@components/Skeleton";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { useElapsedTime, clearAttendanceStart } from "@hooks/useElapsedTime";
import { useAttendanceStore } from "@store/attendance.store";
import { useProfessionalStore } from "@store/professional.store";
import { useIntervalStore, mealName, type Interval } from "@store/interval.store";
import type { AttendanceInQueue } from "@lib/types";
import { getApiErrorMessage } from "@lib/api";
import { parseApiTime, isoDate } from "@lib/time";
import { cardShadow } from "@lib/styles";
import { professionalCompletion } from "@lib/completion";
import { queueMenuActions, formatServices, QUEUE_ACTION_LABEL, type QueueAction } from "@lib/queueCard";
import { ReadinessFaixa } from "@components/ReadinessFaixa";
import { ProfessionalStatusControl } from "@components/ProfessionalStatusControl";
import { comingSoon } from "@components/comingSoon";
import * as SecureStore from "expo-secure-store";

// Janela (min) apos o horario previsto em que ainda vale avisar do almoco.
const MEAL_NUDGE_WINDOW_MIN = 45;

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Card do atendimento EM ANDAMENTO (atual) — Pausar/Finalizar/Retomar.
function AttendanceCard({
  attendance,
  onFinish,
  onPause,
  onResume,
}: {
  attendance: AttendanceInQueue;
  onFinish?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}) {
  const isInProgress = attendance.status === "IN_PROGRESS";
  const isPaused = attendance.status === "PAUSED";

  const { formatted } = useElapsedTime(
    isInProgress || isPaused ? attendance.id : null,
    (attendance as any).startTime ?? null,
    isPaused
  );

  return (
    <VStack
      bg="$white"
      p="$4"
      borderRadius="$2xl"
      borderWidth="$2"
      borderColor="$green400"
      style={cardShadow}
      mb="$3"
    >
      <HStack justifyContent="space-between" alignItems="center">
        <Text fontFamily="$heading" fontWeight="$bold" fontSize="$lg" color="$coolGray900">
          {attendance.clientName}
        </Text>
        <Badge action={isInProgress ? "success" : "warning"} variant="solid" borderRadius="$md">
          <BadgeText fontSize="$xs">{isInProgress ? "EM ATENDIMENTO" : "PAUSADO"}</BadgeText>
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
        <Text fontFamily="$body" fontSize="$sm" color={isInProgress ? "$green500" : "$amber500"}>
          {formatted}
        </Text>
      </HStack>

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
    </VStack>
  );
}

// Linha ENXUTA da lista de espera. O 1o (indice 0) ganha destaque + botao
// "Iniciar"; os demais viram linhas compactas. As acoes de gestao vao no menu
// ⋮ (kebab), que segue a POSICAO (ver src/lib/queueCard.ts). "Atrasado" e so um
// selo — a regra de atender/gerir e a mesma independente do status.
function QueueRow({
  attendance,
  position,
  isFirst,
  onStart,
  onMenu,
}: {
  attendance: AttendanceInQueue;
  position: number;
  isFirst: boolean;
  onStart: () => void;
  onMenu: () => void;
}) {
  const isLate = attendance.status === "LATE";
  const services = formatServices(attendance.services);
  const price = `R$ ${attendance.totalValue.toFixed(2)}`;

  const kebab = (
    <Pressable onPress={onMenu} px="$2" py="$2" hitSlop={8} accessibilityLabel="Mais acoes">
      <Text fontSize="$xl" color="$coolGray500">⋮</Text>
    </Pressable>
  );

  if (isFirst) {
    return (
      <HStack
        bg="$white"
        p="$4"
        borderRadius="$2xl"
        borderWidth="$1"
        borderColor="$green200"
        style={cardShadow}
        mb="$3"
        alignItems="center"
        space="sm"
      >
        <VStack w="$6" h="$6" bg="$green500" borderRadius="$full" alignItems="center" justifyContent="center">
          <Text fontFamily="$heading" fontWeight="$bold" fontSize="$xs" color="$white">
            {position}
          </Text>
        </VStack>
        <VStack flex={1}>
          <Text fontFamily="$heading" fontWeight="$bold" fontSize="$md" color="$coolGray900">
            {attendance.clientName}
          </Text>
          <Text fontFamily="$body" fontSize="$sm" color="$coolGray600">
            {services} · {price}
          </Text>
          <Text fontFamily="$body" fontSize="$xs" color={isLate ? "$amber600" : "$green600"} mt="$0.5">
            {isLate ? "Atrasado" : "Proximo da vez"}
          </Text>
        </VStack>
        <Button title="Iniciar" onPress={onStart} bg="$green500" $active-bg="$green600" h="$10" px="$4" />
        {kebab}
      </HStack>
    );
  }

  return (
    <HStack
      bg="$white"
      p="$3"
      pl="$4"
      borderRadius="$xl"
      style={cardShadow}
      mb="$2"
      alignItems="center"
      space="sm"
    >
      <Text fontFamily="$heading" fontWeight="$bold" fontSize="$sm" color="$coolGray500" w="$5" textAlign="center">
        {position}
      </Text>
      <VStack flex={1}>
        <HStack alignItems="center" space="sm">
          <Text fontFamily="$heading" fontWeight="$bold" fontSize="$sm" color="$coolGray900">
            {attendance.clientName}
          </Text>
          <Badge action={isLate ? "warning" : "muted"} variant="solid" borderRadius="$md" size="sm">
            <BadgeText fontSize="$xs">{isLate ? "atrasado" : "aguardando"}</BadgeText>
          </Badge>
        </HStack>
        <Text fontFamily="$body" fontSize="$xs" color="$coolGray600">
          {services} · {price}
        </Text>
      </VStack>
      {kebab}
    </HStack>
  );
}

export default function ProfessionalQueueScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  const establishmentId = professional?.establishment_id;

  const { data, isLoading, refetch } = useQueuePolling(establishmentId ?? null);
  const { startAttendance, finishAttendance, pauseAttendance, resumeAttendance, markLate, removeFromQueue } =
    useAttendanceStore();

  const intervals = useIntervalStore((s) => s.intervals);
  const fetchIntervals = useIntervalStore((s) => s.fetchIntervals);
  const startInterval = useIntervalStore((s) => s.startInterval);
  const finishInterval = useIntervalStore((s) => s.finishInterval);
  const skipInterval = useIntervalStore((s) => s.skipInterval);
  const meals = intervals.filter((i) => i.type === "RECURRENT");

  const myServices = useProfessionalStore((s) => s.myServices);
  const fetchMyServices = useProfessionalStore((s) => s.fetchMyServices);

  // Anti-nag: refeicoes ja avisadas nesta sessao (nao repetir o popup).
  const nudgedRef = useRef<Set<string>>(new Set());

  const [refreshing, setRefreshing] = useState(false);
  // Cliente cujo menu ⋮ esta aberto (action sheet), ou null.
  const [menuTarget, setMenuTarget] = useState<AttendanceInQueue | null>(null);

  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => handler.remove();
  }, []);

  useEffect(() => {
    if (!establishmentId) {
      useProfessionalStore.getState().fetchMe().catch(() => {});
    }
  }, [establishmentId]);

  // Servicos do profissional — p/ o checklist de prontidao (2 completes).
  useEffect(() => {
    if (establishmentId) fetchMyServices().catch(() => {});
  }, [establishmentId, fetchMyServices]);

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

  // "Nao almocar" do dia: pula a refeicao e derruba do ETA dos clientes (#17/#41).
  const handleSkipMeal = useCallback(
    async (m: Interval) => {
      if (!profId) return;
      try {
        await skipInterval(profId, m.intervalId);
      } catch (error: any) {
        Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel pular a refeicao."));
      }
    },
    [profId, skipInterval]
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
          { text: "Nao almocar", style: "destructive", onPress: () => handleSkipMeal(due) },
          { text: "Iniciar agora", onPress: () => handleStartMeal(due) },
        ]
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [meals, profId, data, handleStartMeal, handleSkipMeal]);

  const myProfessional = data?.professionals?.find((p) => p.id === professional?.id);
  const currentAttendance = myProfessional?.current_attendance;
  const waitingList = myProfessional?.waiting_list ?? [];
  const menuIsFirst = !!menuTarget && waitingList[0]?.id === menuTarget.id;

  // Checklist de prontidao (2 completes). Ver src/lib/completion.ts.
  const completion = professionalCompletion({
    isAffiliated: !!establishmentId,
    hasService: myServices.length > 0,
    hasNickname: !!professional?.nickname,
    hasSpecialty: !!professional?.specialty,
  });
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

  // Inicia o atendimento escolhido. Se houver um atendimento EM ANDAMENTO, ele e
  // finalizado antes (o profissional optou por pular pro proximo — ou por atender
  // alguem fora de ordem). `advance` = o escolhido nao e o 1o da fila.
  const startClient = (att: AttendanceInQueue, advance: boolean) => {
    const runningName = currentAttendance?.clientName;
    const doStart = () =>
      handleAction(async () => {
        if (currentAttendance) {
          await finishAttendance(currentAttendance.id);
          clearAttendanceStart(currentAttendance.id);
        }
        await startAttendance(att.id);
      });

    // Inicio direto (sem confirmacao) so quando e o 1o da fila E ninguem esta em
    // atendimento. Nos demais casos confirma (vai finalizar o atual e/ou furar a fila).
    if (!runningName && !advance) {
      doStart();
      return;
    }
    const msg = runningName
      ? `Isso finaliza o atendimento de ${runningName} e ${advance ? `atende ${att.clientName} na frente da fila` : `inicia ${att.clientName}`}. Continuar?`
      : `${att.clientName} sera atendido agora, na frente da fila. Tem certeza?`;
    Alert.alert(advance ? "Adiantar cliente" : "Iniciar atendimento", msg, [
      { text: "Cancelar" },
      { text: advance ? "Adiantar" : "Iniciar", onPress: doStart },
    ]);
  };

  // "Nao chegou": o cliente da vez cai uma posicao e vira ATRASADO (repetivel,
  // sem teto). O proximo passa a ser o 1o.
  const confirmLate = (att: AttendanceInQueue) => {
    Alert.alert(
      "Cliente nao chegou",
      `${att.clientName} cai uma posicao e o proximo passa a ser o primeiro. Continuar?`,
      [
        { text: "Cancelar" },
        { text: "Confirmar", onPress: () => handleAction(() => markLate(att.id)) },
      ]
    );
  };

  // "Remover": acao do profissional (status REMOVIDO). Sem pre-requisito — pode
  // remover a qualquer momento, inclusive no 1o atraso.
  const confirmRemove = (att: AttendanceInQueue) => {
    Alert.alert("Remover da fila", `Remover ${att.clientName}?`, [
      { text: "Cancelar" },
      { text: "Remover", style: "destructive", onPress: () => handleAction(() => removeFromQueue(att.id)) },
    ]);
  };

  const runMenuAction = (action: QueueAction, att: AttendanceInQueue) => {
    if (action === "adiantar") startClient(att, true);
    else if (action === "nao-chegou") confirmLate(att);
    else if (action === "remover") confirmRemove(att);
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

        <ReadinessFaixa
          completion={completion}
          targetRoute="/(professional)/settings"
          goalNoun="atender clientes"
        />

        {/* S1 — controle de status do profissional (stub; backend #10). */}
        <ProfessionalStatusControl
          hasQueue={waitingList.length > 0 || !!currentAttendance}
        />

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
          <VStack mt="$6">
            <SkeletonList count={3} />
          </VStack>
        )}

        {currentAttendance && (
          <VStack mt="$6">
            <Text fontFamily="$heading" fontWeight="$bold" mb="$2" color="$coolGray700">
              Atendimento Atual
            </Text>
            <AttendanceCard
              attendance={currentAttendance}
              onFinish={() =>
                handleAction(async () => {
                  await finishAttendance(currentAttendance.id);
                  clearAttendanceStart(currentAttendance.id);
                })
              }
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
            {waitingList.map((att, idx) => (
              <QueueRow
                key={att.id}
                attendance={att}
                position={idx + 1}
                isFirst={idx === 0}
                onStart={() => startClient(att, false)}
                onMenu={() => setMenuTarget(att)}
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
                    <>
                      {/* S3 (stub; backend "refeicoes Modelo B") — adiantar/adiar
                          a refeicao na janela flexivel. Ao ligar: mover o
                          placement no backend. */}
                      <Pressable onPress={() => comingSoon("Adiantar ou adiar a refeição")} px="$2" py="$1">
                        <Text fontSize="$lg" color="$amber700">⏱</Text>
                      </Pressable>
                      <Pressable onPress={() => handleEditMeal(m)} px="$2" py="$1">
                        <Text fontSize="$lg" color="$amber700">✎</Text>
                      </Pressable>
                    </>
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

      {/* Menu ⋮ do card (action sheet). Acoes por posicao — ver queueMenuActions. */}
      <Modal
        visible={!!menuTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuTarget(null)}
      >
        <VStack flex={1} justifyContent="flex-end">
          <Pressable
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)" }}
            onPress={() => setMenuTarget(null)}
            accessibilityLabel="Fechar menu"
          />
          <VStack bg="$white" borderTopLeftRadius="$2xl" borderTopRightRadius="$2xl" p="$4" pb="$8" space="xs">
            {menuTarget && (
              <>
                <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray700" mb="$1">
                  {menuTarget.clientName}
                </Text>
                {queueMenuActions(menuIsFirst).map((action) => (
                  <Pressable
                    key={action}
                    onPress={() => {
                      const t = menuTarget;
                      setMenuTarget(null);
                      if (t) runMenuAction(action, t);
                    }}
                    py="$3"
                  >
                    <Text
                      fontFamily="$body"
                      fontSize="$md"
                      color={action === "remover" ? "$red600" : "$coolGray900"}
                    >
                      {QUEUE_ACTION_LABEL[action]}
                    </Text>
                  </Pressable>
                ))}
                <Pressable onPress={() => setMenuTarget(null)} py="$3">
                  <Text fontFamily="$body" fontSize="$md" color="$coolGray500">
                    Cancelar
                  </Text>
                </Pressable>
              </>
            )}
          </VStack>
        </VStack>
      </Modal>
    </ScrollView>
  );
}
