import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  RefreshControl,
  BackHandler,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { ChevronRight, Info, Ellipsis, UserPlus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwButton } from "@components/nw/Button";
import { SkeletonList } from "@components/Skeleton";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { useElapsedTime, clearAttendanceStart } from "@hooks/useElapsedTime";
import { useAttendanceStore } from "@store/attendance.store";
import { useProfessionalStore } from "@store/professional.store";
import { useIntervalStore, mealName, type Interval } from "@store/interval.store";
import type { AttendanceInQueue } from "@lib/types";
import { getApiErrorMessage } from "@lib/api";
import { parseApiTime, isoDate } from "@lib/time";
import { professionalCompletion } from "@lib/completion";
import { queueMenuActions, formatServices, QUEUE_ACTION_LABEL, type QueueAction } from "@lib/queueCard";
import { ratingLabel } from "@lib/rating";
import { mealSignal, hhmmToMinutes, MEAL_NUDGE_WINDOW_MIN } from "@lib/meals";
import { queueMenuCount } from "@lib/notifications";
import { NotificationBadge } from "@components/NotificationBadge";
import { isMealNudgeDisabled, setMealNudgeDisabled } from "@lib/mealNudge";
import { ReadinessFaixa } from "@components/ReadinessFaixa";
import { BlocoBloqueio } from "@components/BlocoBloqueio";
import { Titulo } from "@components/Titulo";
import { StatusPill } from "@components/StatusPill";
import { WORK_TO_KEY, KEY_TO_WORK, avisoDeLoja, type StatusKey } from "@lib/workStatus";
import { usePendingCutRequests } from "@hooks/usePendingCutRequests";
import { ClosingPrompt } from "@components/ClosingPrompt";
import { LiveDot } from "@components/LiveDot";
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
    // Pausado fica AMBAR (estado de atencao); atendendo fica no verde-marca —
    // com `forest` por cima, que e o par de contraste da marca. E o card mais
    // claro da tela de proposito: e o que esta acontecendo agora.
    <View
      className={`p-4 rounded-card mt-4 ${isPaused ? "bg-vupth-accentPeach" : "bg-vupth-green"}`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          {/* Pisca so ATENDENDO: pausado esta parado, e ponto piscando
              sinalizaria movimento que não esta acontecendo. */}
          <LiveDot size={7} color={isPaused ? "#FFFFFF" : "#163300"} pulsing={!isPaused} />
          <Text
            className={`font-heading text-[10px] tracking-widest ${
              isPaused ? "text-white" : "text-vupth-forest"
            }`}
          >
            {isPaused ? "ATENDIMENTO PAUSADO" : "ATENDENDO AGORA"}
          </Text>
        </View>
        {/* Cronometro em DM Mono: numero que muda a cada segundo nao pode
            dancar de largura a cada digito. */}
        <Text
          className={`font-mono text-sm ${isPaused ? "text-white" : "text-vupth-forest"}`}
        >
          {formatted}
        </Text>
      </View>

      <View className="mt-3 gap-1">
        <Text
          className={`font-display text-[22px] ${isPaused ? "text-white" : "text-vupth-forest"}`}
        >
          {attendance.clientName}
        </Text>
        <Text
          className={`font-body text-xs font-semibold ${
            isPaused ? "text-white opacity-90" : "text-vupth-forest opacity-70"
          }`}
        >
          {formatServices(attendance.services)} · R$ {attendance.totalValue.toFixed(2)}
        </Text>
      </View>

      {/* Finalizar e a acao mais comum — vem primeiro e cheia. Pausar e a
          excecao e fica vazada. (Estava invertido: Pausar ocupava o primeiro
          lugar.) Botoes sobre card colorido ficam fora das variantes do
          NwButton, que assumem fundo neutro. */}
      <View className="flex-row gap-2.5 mt-4">
        <NwButton
          title="Finalizar"
          onPress={onFinish}
          className={`flex-1 h-11 ${
            isPaused ? "bg-white active:bg-vupth-surface" : "bg-vupth-forest active:bg-vupth-forestSoft"
          }`}
          textClassName={isPaused ? "text-vupth-forest" : "text-vupth-green"}
        />
        {isPaused ? (
          <NwButton
            title="Retomar"
            onPress={onResume}
            className="flex-1 h-11 bg-transparent border-2 border-white active:bg-vupth-accentPeach"
            textClassName="text-white"
          />
        ) : (
          <NwButton
            title="Pausar"
            onPress={onPause}
            className="flex-1 h-11 bg-transparent border-2 border-vupth-forest active:bg-vupth-greenTint"
            textClassName="text-vupth-forest"
          />
        )}
      </View>
    </View>
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
      accessibilityLabel={`Opções de ${attendance.clientName}`}
      className={`bg-vupth-surface pl-4 active:bg-vupth-greenTint ${
        isFirst ? "p-4 rounded-card border border-vupth-forest mb-3" : "p-3 rounded-card mb-2"
      }`}
    >
      <View className="flex-row items-center gap-2">
        <View
          className={`w-6 h-6 rounded-full items-center justify-center ${
            isFirst ? "bg-vupth-forest" : "bg-vupth-surface"
          }`}
        >
          <Text
            className={`font-heading text-xs ${isFirst ? "text-white" : "text-vupth-textSecondary"}`}
          >
            {position}
          </Text>
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text
              className={`font-heading text-vupth-forest ${isFirst ? "text-base" : "text-sm"}`}
            >
              {attendance.clientName}
            </Text>
            {/* [marca-vupth] Era o selo do gluestack (hexes de config/theme/
                Badge.ts, escala warning/muted). O atraso na marca e o pessego
                com forest por cima; o laranja e o cinza antigos nao existem
                na paleta. */}
            {!isFirst && (
              <View
                className={`rounded-md px-1.5 py-0.5 ${
                  isLate ? "bg-vupth-warning" : "bg-vupth-surface"
                }`}
              >
                <Text
                  className={`text-xs ${isLate ? "text-vupth-forest" : "text-vupth-textSecondary"}`}
                >
                  {isLate ? "atrasado" : "aguardando"}
                </Text>
              </View>
            )}
          </View>
          <Text
            className={`font-body text-vupth-textSecondary ${isFirst ? "text-sm" : "text-xs"}`}
          >
            {services} · {price}
          </Text>
          {isFirst && (
            <Text
              className={`font-body text-xs mt-0.5 ${
                isLate ? "text-vupth-textSecondary" : "text-vupth-forest"
              }`}
            >
              {isLate ? "Atrasado" : "Próximo"}
            </Text>
          )}
        </View>

        {/* [marca-vupth] Era o caractere "›" — mesmo padrao ja trocado por
            ícone no dashboard do dono; o Pencil (PROF · 01 Fila) especifica
            chevron-right/lucide aqui também. */}
        <ChevronRight size={18} color="#454745" />
      </View>
    </Pressable>
  );
}

export default function ProfessionalQueueScreen() {
  const insets = useSafeAreaInsets();
  const professional = useProfessionalStore((s) => s.professional);
  const updateMyStatus = useProfessionalStore((s) => s.updateMyStatus);
  const establishmentId = professional?.establishment_id;

  const { data, isLoading, refetch } = useQueuePolling(establishmentId ?? null);
  const {
    startAttendance, finishAttendance, pauseAttendance, resumeAttendance,
    markLate, removeFromQueue, promoteAttendance,
  } = useAttendanceStore();

  const intervals = useIntervalStore((s) => s.intervals);
  const fetchIntervals = useIntervalStore((s) => s.fetchIntervals);
  const startInterval = useIntervalStore((s) => s.startInterval);
  const finishInterval = useIntervalStore((s) => s.finishInterval);
  const skipInterval = useIntervalStore((s) => s.skipInterval);
  const meals = intervals.filter((i) => i.type === "RECURRENT");

  const myServices = useProfessionalStore((s) => s.myServices);
  const fetchMyServices = useProfessionalStore((s) => s.fetchMyServices);

  // Anti-nag: refeicoes ja avisadas nesta sessao (não repetir o popup).
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
        Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível iniciar a refeição."));
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
        Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível pular a refeição."));
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
          ? `Você tem ${count} cliente(s) na fila. Iniciar agora adia o próximo em ~${due.durationMinutes}min.`
          : `Iniciar ${mealName(due.description)} agora (${due.durationMinutes}min)?`,
        [
          { text: "Agora não", style: "cancel" },
          // "Nao ver mais" desliga o popup DE VEZ (Andre 2026-07-20: "sem
          // intromissao na tela"). Depois disso o aviso fica so no menu — dot +
          // contagem. Reversivel em Configuracoes > Refeicoes.
          { text: "Não ver mais", onPress: () => disableMealNudge() },
          { text: "Não almocar", style: "destructive", onPress: () => handleSkipMeal(due) },
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

  // ⚠️ Isto e regra de PRODUTO resolvida no cliente. O certo e o backend
  // derivar "atendendo => trabalhando", porque o app nao e o unico caminho ate
  // um atendimento. Registrado pro Andre; ate la fica aqui.
  const garantirTrabalhando = async () => {
    if (professional?.work_status === "WORKING") return;
    const abertaAntes = data?.open_status === "OPEN";
    try {
      await updateMyStatus("WORKING");
      const fresh = await refetch();
      const aviso = avisoDeLoja("trabalhando", abertaAntes, fresh.data?.open_status === "OPEN");
      if (aviso) Alert.alert(aviso.titulo, aviso.texto);
    } catch {
      // O atendimento ja comecou; o status se resolve no proximo toque da
      // pilula, que agora esta visivel.
    }
  };

  // Troca de status pela pilula do cabecalho. Mesma regra da tela de Opcoes —
  // o AVISO de loja aberta/fechada mora em `avisoDeLoja`, compartilhado, pra
  // nao existirem duas versoes da mesma decisao.
  const selectStatus = async (next: StatusKey) => {
    const abertaAntes = data?.open_status === "OPEN";
    try {
      await updateMyStatus(KEY_TO_WORK[next]);
      const fresh = await refetch();
      const aviso = avisoDeLoja(next, abertaAntes, fresh.data?.open_status === "OPEN");
      if (aviso) Alert.alert(aviso.titulo, aviso.texto);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível mudar o status."));
    }
  };

  // Vinculado (chegou aqui), mas o backend nao o devolve na fila — na pratica
  // significa "sem servico cadastrado". Invisivel para o cliente.
  const semServico = !isLoading && !!data && !myProfessional;

  // Checklist de prontidao (2 completes). Ver src/lib/completion.ts.
  const completion = professionalCompletion({
    isAffiliated: !!establishmentId,
    hasService: myServices.length > 0,
    hasNickname: !!professional?.nickname,
    hasSpecialty: !!professional?.specialty,
  });

  // Notificacoes do menu de Opcoes da fila: refeicao na janela + solicitacoes de
  // corte pendentes (contagem em `queueMenuCount`). A pendencia de CADASTRO saiu
  // daqui em 2026-08-05 — ela ja acende o dot da aba Configuracoes, que e onde o
  // profissional resolve; contar aqui so faria o badge apontar p/ lugar nenhum.
  // "proxima" acende 30min ANTES do horario (pedido do Andre 2026-07-20): o
  // profissional ve com antecedencia, toca e decide iniciar ou nao.
  const currentMealSignal = mealSignal(meals, new Date().getHours() * 60 + new Date().getMinutes());

  // Refeicao EM ANDAMENTO fica na tela (Encerrar a um toque); o resto vai p/ o
  // menu, que mostra o horario da proxima no proprio rotulo.
  const activeMeal = meals.find((m) => m.status === "ACTIVE") ?? null;

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
      Alert.alert("Erro", getApiErrorMessage(error, "Erro ao executar ação."));
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
        // Comecar a atender E dizer que voce esta trabalhando (decisao da
        // Alexia, 2026-08-26). Antes o `work_status` so mudava pela mao: dava
        // pra estar com um cliente na cadeira e o status em "Fora" — e a loja,
        // que DERIVA do status, seguia apagada pros clientes enquanto havia
        // gente sendo atendida.
        //
        // Silencioso de proposito, menos quando muda a loja: quem tocou em
        // "Iniciar" pediu pra atender, nao pra ver um aviso de status. Falhar
        // aqui nao derruba o atendimento, que ja comecou.
        await garantirTrabalhando();
      });

    // Inicio direto (sem confirmacao) so quando e o 1o da fila E ninguem esta em
    // atendimento. Nos demais casos confirma (vai finalizar o atual e/ou furar a fila).
    if (!runningName && !advance) {
      doStart();
      return;
    }
    const msg = runningName
      ? `Isso finaliza o atendimento de ${runningName} e ${advance ? `atende ${att.clientName} na frente da fila` : `inicia ${att.clientName}`}. Continuar?`
      : `${att.clientName} será atendido agora, na frente da fila. Tem certeza?`;
    Alert.alert(advance ? "Adiantar cliente" : "Iniciar atendimento", msg, [
      { text: "Cancelar" },
      { text: advance ? "Adiantar" : "Iniciar", onPress: doStart },
    ]);
  };

  // "Nao chegou": o cliente da vez cai uma posicao e vira ATRASADO (repetivel,
  // sem teto). O proximo passa a ser o 1o.
  const confirmLate = (att: AttendanceInQueue) => {
    Alert.alert(
      "Cliente não chegou",
      `${att.clientName} cai uma posição e o próximo passa a ser o primeiro. Continuar?`,
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
  // C2: contagem de encaixes pendentes pelo hook compartilhado — a MESMA
  // queryKey do rodape e da tela de Encaixes, entao e um cache so. O WS
  // pessoal (eventos CUT_*, assinado no useQueueSocket) invalida; o refetch
  // de 30s e o fallback p/ socket caido.
  const { count: pendingCutRequests } = usePendingCutRequests();

  const runMenuAction = (action: QueueAction, att: AttendanceInQueue) => {
    if (action === "iniciar") startClient(att, false);
    else if (action === "adiantar") startClient(att, true);
    else if (action === "promover") confirmPromote(att);
    else if (action === "nao-chegou") confirmLate(att);
    else if (action === "remover") confirmRemove(att);
  };

  const handleFinishMeal = async (m: Interval) => {
    if (!profId) return;
    try {
      await finishInterval(profId, m.intervalId);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível encerrar a refeição."));
    }
  };

  if (!establishmentId) {
    return (
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader
          title="Fila"
        />
        <View className="mt-4">
          <BlocoBloqueio
            titulo="Você ainda não tem fila"
            texto="Para receber clientes você precisa estar vinculado a um estabelecimento. O dono confirma a solicitação e você passa a aparecer na fila."
            acao="Buscar estabelecimento"
            rota="/(professional)/find-establishment"
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Auto-fechamento (BUG1): o prompt "quer fechar?" com countdown aparece
          por cima da fila quando chega o WS CLOSING_PROMPT (Modal, só visivel se
          houver graceUntil na ui.store). */}
      <ClosingPrompt />
      {/* flex-1 e obrigatorio aqui: como ScrollView virou FILHO (antes era a
          raiz da tela), sem ele a lista cresceria com o conteudo e empurraria a
          barra fixa do rodape para fora da tela. */}
      <ScrollView
        className="flex-1 w-full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      <View className="flex-1 pb-12 px-4">
        {/* O banco de opcoes vira `action` do cabecalho — antes era um bloco
            proprio com margem propria embaixo do Header. */}
        <ScreenHeader
          title="Fila"
          action={
            <View className="flex-row items-center gap-2">
            {/* DS3 — a pilula do proprio status. Ate aqui o `work_status` so
                existia dentro da tela de Opcoes: era preciso ABRIR o menu pra
                descobrir se voce estava trabalhando. */}
            <StatusPill
              current={professional?.work_status ? WORK_TO_KEY[professional.work_status] : null}
              onSelect={selectStatus}
            />
            {/* Nav v2 (2026-07-23): a reticencia NAVEGA p/ a tela de opcoes
                (nada de modal — "mais amigavel a tela inteira"). Badge =
                refeicao na janela + solicitacoes de corte. */}
            <Pressable
            onPress={() => router.push("/(professional)/queue-options" as any)}
            accessibilityRole="button"
            accessibilityLabel="Opções da fila"
            hitSlop={8}
            className="w-10 h-10 rounded-xl bg-vupth-surface items-center justify-center active:bg-vupth-greenTint"
          >
            {/* Era um BANCO — quebra-galho do Andre, nunca escolha de arte, e
                marcado como provisorio na doc desde sempre. Banco nao diz
                "opcoes": nada no desenho sugeria status, refeicoes ou fechar
                fila, que e o que mora atras deste botao. Vira reticencia, que
                e o que o proprio time chamava de "mais opcoes". */}
            <Ellipsis size={22} color="#163300" />
            {/* Badge COM CONTAGEM (Andre 2026-08-05). So conta o que tem dot
                DENTRO do menu — a pendência de cadastro ficou de fora porque o
                dot dela mora na aba Configurações (levar ao lugar certo). */}
            <View style={{ position: "absolute", top: -5, right: -5 }}>
              <NotificationBadge
                testID="menu-dot"
                count={queueMenuCount({
                  pendingRequests: pendingCutRequests,
                  mealPending: currentMealSignal != null,
                })}
              />
            </View>
          </Pressable>
            </View>
          }
        />

        {myProfessional && ratingLabel(myProfessional.rating_average, myProfessional.rating_count) && (
          <Text className="font-body text-sm text-vupth-textSecondary mt-1">
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

        {/* BLOQUEIO vem primeiro: vinculado, mas o backend nao o lista na
            fila por nao ter servico. Era o ULTIMO bloco do arquivo, abaixo de
            tudo — sendo que quando ele aparece nao ha mais nada na tela. */}
        {semServico && (
          <View className="mt-4">
            <BlocoBloqueio
              titulo="Você ainda não aparece para os clientes"
              texto="Você está vinculado, mas precisa de pelo menos um serviço cadastrado para entrar na fila e receber clientes."
              acao="Adicionar serviço"
              rota="/(professional)/my-services?from=queue"
            />
          </View>
        )}

        {/* A faixa de prontidao NAO acumula com o bloqueio. Nesta tela ela so
            pode estar cobrando um passo — "1+ servico" —, ja que "vinculado"
            e pre-requisito para chegar aqui. Ou seja: quando o bloqueio acima
            aparece, os dois cartoes dizem A MESMA COISA, e o de cima diz de
            forma mais vaga ("falta 1 passo") do que o de baixo, que nomeia o
            passo e leva direto a ele. */}
        {!semServico && (
          <ReadinessFaixa
            completion={completion}
            targetRoute="/(professional)/settings"
            goalNoun="atender clientes"
          />
        )}

        {/* Metricas COMPACTAS (design 2026-07-18): os 2 cards verdes viraram
            chips — liberam tela para a fila e para o botao fixo do rodape. */}
        {myProfessional && (
          <View className="flex-row gap-2 mt-4 items-center">
            <View className="flex-row items-center gap-1 bg-vupth-greenTint rounded-full px-3 py-1.5">
              <Text className="text-xs">👥</Text>
              <Text className="font-heading text-xs text-vupth-forest">
                {myProfessional.queue_count} na fila
              </Text>
            </View>
            <View className="flex-row items-center gap-1 bg-vupth-greenTint rounded-full px-3 py-1.5">
              <Text className="text-xs">⏱</Text>
              <Text className="font-heading text-xs text-vupth-forest">
                {myProfessional.estimated_wait_minutes} min
              </Text>
            </View>
          </View>
        )}

        {isLoading && !data && (
          <View className="mt-6">
            <SkeletonList count={3} />
          </View>
        )}

        {waitingList.length > 0 && (
          <View className="mt-6">
            <Titulo nivel={2} className="mb-2">
              Lista de Espera ({waitingList.length})
            </Titulo>
            {waitingList.map((att, idx) => (
              <QueueRow
                key={att.id}
                attendance={att}
                position={idx + 1}
                isFirst={idx === 0}
                onMenu={() => setMenuTarget(att)}
              />
            ))}
          </View>
        )}

        {/* Refeicoes sairam da tela (foram p/ o menu, design 2026-07-20). Fica
            só a faixa da refeição EM ANDAMENTO, porque "Encerrar" precisa estar
            a um toque — o resto (iniciar/adiar/pular/editar) e no menu. */}
        {activeMeal && (
          <View className="flex-row items-center gap-2 mt-6 bg-vupth-accentPeach p-3 rounded-card">
            <Text className="text-base">🍽️</Text>
            <View className="flex-1">
              <Text className="font-heading text-sm text-vupth-forest">
                {mealName(activeMeal.description)} em andamento
              </Text>
              <Text className="font-body text-xs text-vupth-textSecondary">
                {activeMeal.durationMinutes}min previstos
              </Text>
            </View>
            <NwButton
              title="Encerrar"
              onPress={() => handleFinishMeal(activeMeal)}
              className="h-9 px-4 bg-vupth-accentPeach active:bg-vupth-accentPeach"
            />
          </View>
        )}

        {/* DS3 — "Adicionar cliente" saiu do menu (decisao da Alexia). E a acao
            mais frequente do dia e estava enterrada tres toques adentro, no
            mesmo lugar do status. Vive ABAIXO da lista, porque e sobre ela que
            se age, e em `ghost` pra nao brigar com o "Iniciar proximo" fixo do
            rodape — dois botoes cheios na mesma tela e uma escolha, nao uma
            acao. Aparece tambem com a fila vazia, que e quando o cliente que
            chega andando importa mais. */}
        {!isLoading && myProfessional && (
          <NwButton
            title="Adicionar cliente"
            variant="vupthGhost"
            onPress={() => router.push("/(professional)/add-guest" as any)}
            className="self-start mt-3"
            icon={<UserPlus size={16} color="#163300" />}
          />
        )}

        {!isLoading && myProfessional && !currentAttendance && waitingList.length === 0 && (
          /* VAZIO nao e BLOQUEIO: aqui esta tudo certo, so nao ha ninguem
              ainda — e nao ha o que o profissional possa fazer a respeito.
              Entao vem em `surface`, sem acento e sem acao, ao contrario do
              BlocoBloqueio. O `flex-1 items-center justify-center` de antes
              nao centralizava nada (o pai e o conteudo de um ScrollView), so
              empurrava o texto pro meio da largura. */
          <View className="mt-6 bg-vupth-surface rounded-card p-5 gap-1.5">
            <Titulo nivel={2}>Nenhum cliente na fila</Titulo>
            <Text className="font-body text-sm leading-5 text-vupth-textSecondary">
              Novos clientes aparecerão aqui automaticamente.
            </Text>
          </View>
        )}

      </View>
      </ScrollView>

      {/* Botao FIXO do rodape (design 2026-07-18): o unico "start", e sempre
          atende o 1o da fila. Com atendimento em andamento ele vira uma DICA —
          finalize antes de iniciar o próximo (não atende dois ao mesmo tempo). */}
      {waitingList.length > 0 && (
        <View
          className="px-4 pt-3"
          style={{ paddingBottom: 12, backgroundColor: "#FFFFFF" }}
        >
          {currentAttendance ? (
            <View
              className="bg-vupth-surface rounded-full py-3.5 flex-row items-center justify-center gap-1.5"
            >
              {/* Icone info (Pencil PROF · 01 Fila) — a dica antes era so
                  texto; o desenho marca com um icone de informacao. */}
              <Info size={15} color="#454745" />
              <Text className="font-body text-sm text-vupth-textSecondary">
                Finalize para iniciar o próximo
              </Text>
            </View>
          ) : (
            // Rotulo fixo (Andre 2026-08-05): o nome saiu do rodape. Ele ja
            // aparece no card com o selo "Proximo", logo acima do botao.
            <NwButton
              title="Iniciar próximo"
              onPress={() => startClient(waitingList[0], false)}
            />
          )}
        </View>
      )}

      {/* Menu do card (action sheet). Acoes por posicao — ver queueMenuActions. */}
      <Modal
        visible={!!menuTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuTarget(null)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)" }}
            onPress={() => setMenuTarget(null)}
            accessibilityLabel="Fechar menu"
          />
          {/* paddingBottom = barra de gestos do aparelho + folga. Sem o inset,
              a ULTIMA opcao ficava embaixo do rodape do celular (device 08-11). */}
          <View
            className="bg-white rounded-t-2xl p-4 gap-1"
            style={{ paddingBottom: insets.bottom + 24 }}
          >
            {menuTarget && (
              <>
                <Text className="font-heading text-vupth-textSecondary mb-1">
                  {menuTarget.clientName}
                </Text>
                {queueMenuActions(menuIsFirst).map((action) => (
                  <Pressable
                    key={action}
                    accessibilityRole="button"
                    onPress={() => {
                      const t = menuTarget;
                      setMenuTarget(null);
                      if (t) runMenuAction(action, t);
                    }}
                    className="py-3"
                  >
                    <Text
                      className={`font-body text-base ${
                        action === "remover" ? "text-vupth-danger" : "text-vupth-forest"
                      }`}
                    >
                      {QUEUE_ACTION_LABEL[action]}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setMenuTarget(null)}
                  className="py-3"
                >
                  <Text className="font-body text-base text-vupth-textSecondary">Cancelar</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}
