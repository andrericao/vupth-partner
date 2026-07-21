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
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { professionalCompletion, hasAnyPending } from "@lib/completion";
import { queueMenuActions, formatServices, QUEUE_ACTION_LABEL, type QueueAction } from "@lib/queueCard";
import { ratingLabel } from "@lib/rating";
import { mealSignal, hhmmToMinutes, MEAL_NUDGE_WINDOW_MIN } from "@lib/meals";
import { isMealNudgeDisabled, setMealNudgeDisabled } from "@lib/mealNudge";
import { ReadinessFaixa } from "@components/ReadinessFaixa";
import { ProfessionalMenu } from "@components/ProfessionalMenu";
import { useEstablishmentStore } from "@store/establishment.store";
import * as SecureStore from "expo-secure-store";

// Card "ATENDENDO AGORA" (design Andre 2026-07-18, mockup
// design/queue-layout-combined.html). Fica no TOPO da tela e concentra as acoes
// do atendimento em andamento — e a resposta a "como pauso/finalizo no meio do
// atendimento", ja que o botao do rodape passou a ser so o 'Iniciar proximo'.
// Pausado: o card fica ambar, ganha o selo e troca Pausar por Retomar.
function ServingCard({
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
  const isPaused = attendance.status === "PAUSED";
  const { formatted } = useElapsedTime(
    attendance.id,
    (attendance as any).startTime ?? null,
    isPaused
  );

  return (
    <VStack
      bg={isPaused ? "$amber500" : "$green500"}
      p="$4"
      borderRadius="$2xl"
      style={cardShadow}
      mt="$4"
    >
      <HStack alignItems="center" space="xs">
        <VStack w="$2" h="$2" borderRadius="$full" bg="$white" opacity={0.85} />
        <Text fontFamily="$heading" fontWeight="$bold" fontSize="$2xs" color="$white" letterSpacing="$lg">
          {isPaused ? "ATENDIMENTO PAUSADO" : "ATENDENDO AGORA"}
        </Text>
      </HStack>

      <Text fontFamily="$heading" fontWeight="$bold" fontSize="$lg" color="$white" mt="$1">
        {attendance.clientName}
      </Text>
      <Text fontFamily="$body" fontSize="$sm" color="$white" opacity={0.9}>
        {formatServices(attendance.services)} · R$ {attendance.totalValue.toFixed(2)}
      </Text>
      <Text fontFamily="$body" fontSize="$xs" color="$white" opacity={0.95} mt="$1.5">
        ⏱ {formatted}
      </Text>

      <HStack mt="$3" space="sm">
        {isPaused ? (
          <Button
            title="Retomar"
            onPress={onResume}
            bg="$white"
            textColor="$amber700"
            $active-bg="$coolGray100"
            h="$10"
            mt="$0"
            flex={1}
          />
        ) : (
          <Button
            title="Pausar"
            onPress={onPause}
            bg="$green600"
            $active-bg="$green700"
            h="$10"
            mt="$0"
            flex={1}
          />
        )}
        <Button
          title="Finalizar"
          onPress={onFinish}
          bg="$white"
          textColor={isPaused ? "$amber700" : "$green700"}
          $active-bg="$coolGray100"
          h="$10"
          mt="$0"
          flex={1}
        />
      </HStack>
    </VStack>
  );
}

// Linha da lista de espera. O CARD INTEIRO e clicavel e abre o menu de acoes
// (design Andre 2026-07-18) — o kebab ⋮ saiu, o que elimina o toque errado ao
// lado do botao. "Iniciar" tambem saiu do card: virou o botao FIXO do rodape,
// que sempre atende o 1o. O 1o segue em destaque com o selo "Proximo"
// (redundancia proposital). "Atrasado" e so um selo; as acoes seguem a POSICAO
// (ver src/lib/queueCard.ts).
function QueueRow({
  attendance,
  position,
  isFirst,
  onMenu,
}: {
  attendance: AttendanceInQueue;
  position: number;
  isFirst: boolean;
  onMenu: () => void;
}) {
  const isLate = attendance.status === "LATE";
  const services = formatServices(attendance.services);
  const price = `R$ ${attendance.totalValue.toFixed(2)}`;

  return (
    <Pressable
      onPress={onMenu}
      accessibilityRole="button"
      accessibilityLabel={`Opcoes de ${attendance.clientName}`}
      bg="$white"
      p={isFirst ? "$4" : "$3"}
      pl="$4"
      borderRadius={isFirst ? "$2xl" : "$xl"}
      borderWidth={isFirst ? "$1" : "$0"}
      borderColor="$green200"
      style={cardShadow}
      mb={isFirst ? "$3" : "$2"}
      $active-bg="$coolGray50"
    >
      <HStack alignItems="center" space="sm">
        <VStack
          w="$6"
          h="$6"
          bg={isFirst ? "$green500" : "$coolGray100"}
          borderRadius="$full"
          alignItems="center"
          justifyContent="center"
        >
          <Text
            fontFamily="$heading"
            fontWeight="$bold"
            fontSize="$xs"
            color={isFirst ? "$white" : "$coolGray500"}
          >
            {position}
          </Text>
        </VStack>

        <VStack flex={1}>
          <HStack alignItems="center" space="sm">
            <Text
              fontFamily="$heading"
              fontWeight="$bold"
              fontSize={isFirst ? "$md" : "$sm"}
              color="$coolGray900"
            >
              {attendance.clientName}
            </Text>
            {!isFirst && (
              <Badge action={isLate ? "warning" : "muted"} variant="solid" borderRadius="$md" size="sm">
                <BadgeText fontSize="$xs">{isLate ? "atrasado" : "aguardando"}</BadgeText>
              </Badge>
            )}
          </HStack>
          <Text fontFamily="$body" fontSize={isFirst ? "$sm" : "$xs"} color="$coolGray600">
            {services} · {price}
          </Text>
          {isFirst && (
            <Text fontFamily="$body" fontSize="$xs" color={isLate ? "$amber600" : "$green600"} mt="$0.5">
              {isLate ? "Atrasado" : "Proximo"}
            </Text>
          )}
        </VStack>

        <Text fontSize="$lg" color="$coolGray400" fontWeight="$bold">
          ›
        </Text>
      </HStack>
    </Pressable>
  );
}

export default function ProfessionalQueueScreen() {
  const insets = useSafeAreaInsets();
  const professional = useProfessionalStore((s) => s.professional);
  const establishmentId = professional?.establishment_id;

  const { data, isLoading, refetch } = useQueuePolling(establishmentId ?? null);
  const { startAttendance, finishAttendance, pauseAttendance, resumeAttendance, markLate, removeFromQueue, promoteAttendance } =
    useAttendanceStore();
  const updateOpenStatus = useEstablishmentStore((s) => s.updateOpenStatus);

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

  // "Nao ver mais": desliga o popup de vez. O aviso continua no menu (dot +
  // contagem). Reversivel em Configuracoes > Refeicoes.
  const disableMealNudge = useCallback(async () => {
    try {
      await setMealNudgeDisabled(true);
    } catch {
      // preferencia e best-effort; nao vale interromper o atendimento por isso
    }
  }, []);

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
      // "Nao ver mais": o profissional desligou o popup — o aviso segue no
      // menu (dot + contagem), sem intromissao na tela.
      if (await isMealNudgeDisabled()) return;

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
          // "Nao ver mais" desliga o popup DE VEZ (Andre 2026-07-20: "sem
          // intromissao na tela"). Depois disso o aviso fica so no menu — dot +
          // contagem. Reversivel em Configuracoes > Refeicoes.
          { text: "Nao ver mais", onPress: () => disableMealNudge() },
          { text: "Nao almocar", style: "destructive", onPress: () => handleSkipMeal(due) },
          { text: "Iniciar agora", onPress: () => handleStartMeal(due) },
        ]
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [meals, profId, data, handleStartMeal, handleSkipMeal, disableMealNudge]);

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

  // Dots do menu ☰ (design 2026-07-18): refeicao dentro da janela + pendencia
  // de cadastro. O 3o gatilho pedido (solicitacoes de corte com a fila fechada)
  // aguarda o backend — ver HANDOFF_BACKEND "Detalhe — C2".
  // "proxima" acende 30min ANTES do horario (pedido do Andre 2026-07-20): o
  // profissional ve com antecedencia, toca e decide iniciar ou nao.
  const currentMealSignal = mealSignal(meals, new Date().getHours() * 60 + new Date().getMinutes());
  const settingsDot = hasAnyPending(completion);

  // Refeicao EM ANDAMENTO fica na tela (Encerrar a um toque); o resto vai p/ o
  // menu, que mostra o horario da proxima no proprio rotulo.
  const activeMeal = meals.find((m) => m.status === "ACTIVE") ?? null;
  const nextMeal = meals.find((m) => m.status === "SCHEDULED") ?? null;
  const mealLabel = nextMeal
    ? `${mealName(nextMeal.description)} ${parseApiTime(nextMeal.fixedStartTime) ?? ""}`.trim()
    : undefined;

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

  // "Promover ao topo" (S4): reordena ao 1o lugar SEM iniciar — os demais descem
  // e o cliente vira o proximo. Diferente de "Adiantar", que inicia na hora.
  const confirmPromote = (att: AttendanceInQueue) => {
    Alert.alert(
      "Promover ao topo",
      `${att.clientName} vai para o 1o lugar da fila, sem iniciar o atendimento. Continuar?`,
      [
        { text: "Cancelar" },
        { text: "Promover", onPress: () => handleAction(() => promoteAttendance(att.id)) },
      ]
    );
  };

  // Abrir/fechar o ESTABELECIMENTO pelo menu ☰ (pedido Andre 2026-07-18). O
  // backend aceita profissional afiliado no PATCH /open-status; o gate de fechar
  // com fila ativa (409 ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES) e tratado pelo
  // handleAction, que traduz a mensagem.
  const isEstablishmentOpen = data?.open_status === "OPEN";
  // "Aberto agora" EFETIVO (backend `is_open`): a chave manual pode estar em
  // OPEN com o horario ja vencido — nesse caso o cliente ve fechado e o gate
  // barra a entrada. Fallback p/ a chave manual se o backend nao mandar o campo.
  const isEstablishmentOpenNow = data?.is_open ?? isEstablishmentOpen;
  const toggleEstablishment = () => {
    if (!establishmentId) return;
    const next = isEstablishmentOpen ? "CLOSED" : "OPEN";
    Alert.alert(
      isEstablishmentOpen ? "Fechar estabelecimento" : "Abrir estabelecimento",
      isEstablishmentOpen
        ? "A loja para de aparecer para os clientes e ninguem novo entra na fila. Continuar?"
        : "A loja passa a aparecer para os clientes e a receber novos na fila. Continuar?",
      [
        { text: "Cancelar" },
        {
          text: isEstablishmentOpen ? "Fechar" : "Abrir",
          onPress: () => handleAction(() => updateOpenStatus(establishmentId, next)),
        },
      ]
    );
  };

  const runMenuAction = (action: QueueAction, att: AttendanceInQueue) => {
    if (action === "adiantar") startClient(att, true);
    else if (action === "promover") confirmPromote(att);
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

  if (!establishmentId) {
    return (
      <VStack flex={1} py="$12" px="$6">
        <Header />
        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Fila
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
    <VStack flex={1}>
      {/* flex={1} e obrigatorio aqui: como ScrollView virou FILHO (antes era a
          raiz da tela), sem ele a lista cresceria com o conteudo e empurraria a
          barra fixa do rodape para fora da tela. */}
      <ScrollView
        flex={1}
        w="$full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      <VStack flex={1} py="$12" px="$6">
        <Header />

        {/* Titulo + menu ☰ lado a lado (a tab bar saiu do rodape). */}
        <HStack mt="$4" alignItems="center" justifyContent="space-between">
          <Heading size="2xl" fontFamily="$heading">
            Fila
          </Heading>
          <ProfessionalMenu
            mealSignal={currentMealSignal}
            settingsDot={settingsDot}
            mealLabel={mealLabel}
            hasQueue={waitingList.length > 0 || !!currentAttendance}
            establishment={
              establishmentId
                ? {
                    isOpen: isEstablishmentOpen,
                    isOpenNow: isEstablishmentOpenNow,
                    onToggle: toggleEstablishment,
                  }
                : undefined
            }
          />
        </HStack>

        {myProfessional && ratingLabel(myProfessional.rating_average, myProfessional.rating_count) && (
          <Text fontFamily="$body" fontSize="$sm" color="$amber600" mt="$1">
            ★ {ratingLabel(myProfessional.rating_average, myProfessional.rating_count)} · sua avaliação
          </Text>
        )}

        {/* Atendimento em andamento manda na tela: vem ANTES de tudo. */}
        {currentAttendance && (
          <ServingCard
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
        )}

        <ReadinessFaixa
          completion={completion}
          targetRoute="/(professional)/settings"
          goalNoun="atender clientes"
        />

        {/* Metricas COMPACTAS (design 2026-07-18): os 2 cards verdes viraram
            chips — liberam tela para a fila e para o botao fixo do rodape. */}
        {myProfessional && (
          <HStack space="sm" mt="$4" alignItems="center">
            <HStack bg="$green100" borderRadius="$full" px="$3" py="$1.5" alignItems="center" space="xs">
              <Text fontSize="$xs">👥</Text>
              <Text fontFamily="$heading" fontWeight="$bold" fontSize="$xs" color="$green700">
                {myProfessional.queue_count} na fila
              </Text>
            </HStack>
            <HStack bg="$green100" borderRadius="$full" px="$3" py="$1.5" alignItems="center" space="xs">
              <Text fontSize="$xs">⏱</Text>
              <Text fontFamily="$heading" fontWeight="$bold" fontSize="$xs" color="$green700">
                {myProfessional.estimated_wait_minutes} min
              </Text>
            </HStack>
          </HStack>
        )}

        {isLoading && !data && (
          <VStack mt="$6">
            <SkeletonList count={3} />
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
                onMenu={() => setMenuTarget(att)}
              />
            ))}
          </VStack>
        )}

        {/* Refeicoes sairam da tela (foram p/ o menu, design 2026-07-20). Fica
            so a faixa da refeicao EM ANDAMENTO, porque "Encerrar" precisa estar
            a um toque — o resto (iniciar/adiar/pular/editar) e no menu. */}
        {activeMeal && (
          <HStack
            mt="$6"
            bg="$amber100"
            p="$3"
            borderRadius="$2xl"
            borderWidth="$1"
            borderColor="$amber300"
            alignItems="center"
            space="sm"
          >
            <Text fontSize="$md">🍽️</Text>
            <VStack flex={1}>
              <Text fontFamily="$heading" fontWeight="$bold" fontSize="$sm" color="$amber700">
                {mealName(activeMeal.description)} em andamento
              </Text>
              <Text fontFamily="$body" fontSize="$xs" color="$amber600">
                {activeMeal.durationMinutes}min previstos
              </Text>
            </VStack>
            <Button
              title="Encerrar"
              onPress={() => handleFinishMeal(activeMeal)}
              bg="$amber500"
              $active-bg="$amber600"
              h="$9"
              mt="$0"
            />
          </HStack>
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

      {/* Botao FIXO do rodape (design 2026-07-18): o unico "start", e sempre
          atende o 1o da fila. Com atendimento em andamento ele vira uma DICA —
          finalize antes de iniciar o proximo (nao atende dois ao mesmo tempo). */}
      {waitingList.length > 0 && (
        <VStack
          px="$6"
          pt="$3"
          style={{ paddingBottom: insets.bottom + 16, backgroundColor: "#F7FAF8" }}
        >
          {currentAttendance ? (
            <VStack
              bg="$white"
              borderRadius="$full"
              py="$3.5"
              alignItems="center"
              style={cardShadow}
            >
              <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
                Finalize para iniciar o proximo · {waitingList[0].clientName}
              </Text>
            </VStack>
          ) : (
            <Button
              title={`Iniciar proximo · ${waitingList[0].clientName}`}
              onPress={() => startClient(waitingList[0], false)}
              bg="$green500"
              $active-bg="$green600"
              mt="$0"
            />
          )}
        </VStack>
      )}

      {/* Menu do card (action sheet). Acoes por posicao — ver queueMenuActions. */}
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
    </VStack>
  );
}
