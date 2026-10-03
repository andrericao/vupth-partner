import { useState, useCallback, useEffect, useRef } from "react";
import { useVoltarAoTopo, usePilulaTopo } from "@hooks/useVoltarAoTopo";
import { PilulaVoltarAoTopo } from "@components/PilulaVoltarAoTopo";
import { View, Text, Pressable, ScrollView, Alert, RefreshControl, BackHandler, Modal, Platform } from "react-native";
import { router } from "expo-router";
import { ChevronRight, Info, Ellipsis, UserPlus, Users, Clock, UtensilsCrossed, Star, RotateCw } from "lucide-react-native";
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
import { confirmar, avisar } from "@lib/confirmar";
import { parseApiTime, isoDate } from "@lib/time";
import { professionalCompletion } from "@lib/completion";
import { mensagemDoAtraso, queueMenuActions, formatServices, QUEUE_ACTION_LABEL, type QueueAction } from "@lib/queueCard";
import { ratingLabel } from "@lib/rating";
import {
  mealSignal, hhmmToMinutes, MEAL_NUDGE_WINDOW_MIN,
  refeicoesDoDia, rotuloRefeicaoIniciada, refeicaoCruzada, duracaoDoAtendimento,
} from "@lib/meals";
import { queueMenuCount } from "@lib/notifications";
import { NotificationBadge } from "@components/NotificationBadge";
import { isMealNudgeDisabled, setMealNudgeDisabled, devePerguntarRefeicao } from "@lib/mealNudge";
import { ReadinessFaixa } from "@components/ReadinessFaixa";
import { BlocoBloqueio } from "@components/BlocoBloqueio";
import { Titulo } from "@components/Titulo";
import { StatusPill } from "@components/StatusPill";
import { EstadoVazio } from "@components/EstadoVazio";
import { AceitandoNovos } from "@components/AceitandoNovos";
import { WORK_TO_KEY, KEY_TO_WORK, avisoDeLoja, type StatusKey } from "@lib/workStatus";
import { usePendingCutRequests } from "@hooks/usePendingCutRequests";
import { SolicitacoesCard } from "@components/SolicitacoesCard";
import { resumoDeSolicitacoes } from "@lib/cutRequests";
import { escolherAtendimentoAtual } from "@lib/atendimentoAtual";
import { finalizarAtendimento } from "@lib/finalizar";
import { fechaFilaAoSair, viraTrabalhandoAoAbrirFila } from "@lib/coerenciaFila";
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
    isPaused,
    // A4: o backend manda o total pausado (em minutos) e ele e o piso do
    // desconto — cobre reabrir o app no meio de uma pausa.
    (attendance as any).pausedTimeMinutes ?? null
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
            className={`font-heading text-f10 tracking-widest ${
              isPaused ? "text-white" : "text-vupth-forest"
            }`}
          >
            {isPaused ? "ATENDIMENTO PAUSADO" : "ATENDENDO AGORA"}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {/* Cronometro em DM Mono: numero que muda a cada segundo nao pode
              dancar de largura a cada digito. */}
          <Text
            className={`font-mono text-sm ${isPaused ? "text-white" : "text-vupth-forest"}`}
            testID="cronometro"
          >
            {formatted}
          </Text>
          {/* O sinal de que o card tem MAIS opcoes (Remover, alem dos botoes).
              Sem ele o menu existia e ninguem o achava (Andre, 24/09). */}
          <Ellipsis size={18} color={isPaused ? "#FFFFFF" : "#163300"} />
        </View>
      </View>

      <View className="mt-3 gap-1">
        <Text
          className={`font-display text-f22 ${isPaused ? "text-white" : "text-vupth-forest"}`}
        >
          {attendance.clientName}
        </Text>
        <Text
          className={`font-body text-xs font-semibold ${
            isPaused ? "text-white opacity-90" : "text-vupth-forest opacity-70"
          }`}
        >
          {/* `?? 0`: campo faltando NAO pode derrubar a tela. Foi assim que o
              app ficou branco no meio de um atendimento (08/09) — a rede local
              alimentou o card com o payload do `/start`, que nao trazia
              `totalValue`, e `undefined.toFixed` levou o render junto. */}
          {formatServices(attendance.services ?? [])} · R$ {(attendance.totalValue ?? 0).toFixed(2)}
        </Text>
      </View>

      {/* Finalizar e a acao mais comum — vem primeiro e cheia. Pausar e a
          excecao e fica vazada. (Estava invertido: Pausar ocupava o primeiro
          lugar.) Botoes sobre card colorido ficam fora das variantes do
          NwButton, que assumem fundo neutro. */}
      <View className="flex-row gap-2.5 mt-4">
        {/* 🔴 O FINALIZAR ESTAVA INVISIVEL EM ATENDIMENTO (16/09). Sem `variant`, o
            NwButton usa o `primary`, que ja traz `bg-vupth-green`; o fundo
            forest vinha por `className` e os DOIS conviviam. O NativeWind nao
            respeita a ordem escrita — resolve pela folha de estilo, e o verde
            vencia. Resultado: botao verde, texto verde, sobre o card verde. O
            botao estava la, clicavel, e ninguem via. Pausado ele reaparecia
            porque o card vira pessego e o texto vira escuro.
            Agora a cor vem do VARIANT, sem sobrescrever fundo nenhum:
            `vupthSecondary` e o Button/Secondary do desenho — fundo forest,
            rotulo brand-green, "a ancora escura sobre fundo ja colorido". */}
        <NwButton
          title="Finalizar"
          onPress={onFinish}
          variant={isPaused ? "outlineBrand" : "vupthSecondary"}
          className="flex-1 h-11"
        />
        {isPaused ? (
          // Era branco sobre pessego (~1,6:1 de contraste — ilegivel) e com o
          // mesmo conflito de fundo do Finalizar. O vazado forest le em
          // qualquer um dos dois cards.
          <NwButton
            title="Retomar"
            onPress={onResume}
            variant="vupthOutline"
            className="flex-1 h-11"
          />
        ) : (
          <NwButton
            title="Pausar"
            onPress={onPause}
            variant="vupthOutline"
            className="flex-1 h-11"
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
  const services = formatServices(attendance.services ?? []);
  const price = `R$ ${(attendance.totalValue ?? 0).toFixed(2)}`;

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
  // Tocar na aba JA ATIVA volta ao topo (Andre, 18/09).
  const rolagemRef = useVoltarAoTopo();
  const pilula = usePilulaTopo(rolagemRef);

  const insets = useSafeAreaInsets();
  const professional = useProfessionalStore((s) => s.professional);
  const updateMyStatus = useProfessionalStore((s) => s.updateMyStatus);
  const setAcceptingNew = useProfessionalStore((s) => s.setAcceptingNew);
  const establishmentId = professional?.establishment_id;

  const { data, isLoading, refetch } = useQueuePolling(establishmentId ?? null);
  const {
    startAttendance, finishAttendance, pauseAttendance, resumeAttendance,
    markLate, removeFromQueue, promoteAttendance, atendimentoIniciado,
  } = useAttendanceStore();

  const intervals = useIntervalStore((s) => s.intervals);
  const fetchIntervals = useIntervalStore((s) => s.fetchIntervals);
  const startInterval = useIntervalStore((s) => s.startInterval);
  const finishInterval = useIntervalStore((s) => s.finishInterval);
  const skipInterval = useIntervalStore((s) => s.skipInterval);
  // Modelo B: a refeicao suprimida hoje (passou do inicio maximo) some do dia.
  const meals = refeicoesDoDia(intervals.filter((i) => i.type === "RECURRENT"));

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
  // E so para quem esta trabalhando numa loja aberta (Andre, 25/09) — ver
  // devePerguntarRefeicao.
  const perguntaRefeicao = devePerguntarRefeicao(professional?.work_status, data);
  useEffect(() => {
    if (!profId || !perguntaRefeicao) return;
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
      // ⚠️ ESTE E O UNICO Alert.alert COM BOTOES QUE SOBROU, e de proposito:
      // sao QUATRO opcoes, e o `window.confirm` da web so faz duas. O nativo
      // fica intacto; na web degradamos para a pergunta principal.
      //
      // O que se perde na web: "Nao ver mais" e "Nao almocar". Nenhuma das duas
      // some do app — a primeira e reversivel em Configuracoes > Refeicoes, e a
      // refeicao segue no menu com dot e contagem. Quando existir o modal da
      // marca (pergunta aberta no PR #27 do design), as quatro voltam a caber.
      if (Platform.OS === "web") {
        const iniciar = await confirmar({
          titulo: `Hora do ${mealName(due.description)}`,
          mensagem:
            count > 0
              ? `Você tem ${count} cliente(s) na fila. Iniciar agora adia o próximo em ~${due.durationMinutes}min.`
              : `Iniciar ${mealName(due.description)} agora (${due.durationMinutes}min)?`,
          confirmar: "Iniciar agora",
          cancelar: "Agora não",
        });
        if (iniciar) handleStartMeal(due);
        return;
      }

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
  }, [meals, profId, data, perguntaRefeicao, handleStartMeal, handleSkipMeal, disableMealNudge]);

  const myProfessional = data?.professionals?.find((p) => p.id === professional?.id);
  // O snapshot manda; a memoria local do `start` preenche o silencio dele.
  // Sem esta segunda fonte, um `current_attendance` vazio durante o IN_PROGRESS
  // apagava o card inteiro — e com ele o Finalizar. Ver escolherAtendimentoAtual.
  const currentAttendance = escolherAtendimentoAtual(
    myProfessional?.current_attendance,
    atendimentoIniciado,
    myProfessional?.waiting_list
  );
  // Fora da espera quem ja esta sendo atendido: se o backend deixar o atendimento
  // em curso dentro da lista (ver escolherAtendimentoAtual), ele apareceria duas
  // vezes — no card verde e como proximo da fila.
  const waitingList = (myProfessional?.waiting_list ?? []).filter(
    (a) => a.id !== currentAttendance?.id
  );
  const menuIsFirst = !!menuTarget && waitingList[0]?.id === menuTarget.id;

  // DS3 (c) — a fila aceita gente nova? Ausente => aceitando.
  const aceitandoNovos = professional?.accepting_new ?? true;
  const statusAtual: StatusKey = professional?.work_status
    ? WORK_TO_KEY[professional.work_status]
    : "trabalhando";
  const aplicarAceitando = async (valor: boolean) => {
    try {
      // A porta de tras da mesma regra: abrir a fila estando "Fora" recriaria o
      // estado proibido. Abrir a fila implica estar em cena.
      if (viraTrabalhandoAoAbrirFila(statusAtual, valor)) {
        await updateMyStatus("WORKING");
        await avisar({
          titulo: "Você voltou para a fila",
          mensagem: "Abrir a fila marca você como Trabalhando — não dá para receber cliente estando fora.",
        });
      }
      await setAcceptingNew(valor);
      const fresh = await refetch();
      // Fechar a fila sendo o ultimo dispara auto-OFF no backend => a loja
      // fecha (derivada). So da pra saber DEPOIS, comparando.
      if (!valor && fresh.data?.open_status !== "OPEN") {
        Alert.alert(
          "Loja fechada",
          "Você era o último — a fila e a loja foram fechadas para os clientes."
        );
      }
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível atualizar a fila."));
    }
  };
  const alternarAceitando = async () => {
    // Reabrir e inofensivo e vai direto. Fechar confirma: quem ja esta na fila
    // continua, mas ninguem novo entra — e pode fechar a loja junto.
    // (Confirmacao assimetrica: e a decisao da design no DS3, 31/08.)
    if (!aceitandoNovos) {
      aplicarAceitando(true);
      return;
    }
    // ⚠️ `confirmar()` e nao `Alert.alert` com botoes: o react-native-web nao
    // implementa o Alert, entao na web a caixa nunca aparecia, o callback nunca
    // rodava e a chave voltava sozinha — foi o "esse botao nao funciona" da
    // issue #25. Fechar a fila e justamente o lado que pede confirmacao, entao
    // na web SO o lado destrutivo estava morto: reabrir funcionava.
    const ok = await confirmar({
      titulo: "Fechar fila",
      mensagem:
        "Ninguém novo entra na sua fila. Quem já está continua sendo atendido; ao terminar o último você fica indisponível (e a loja fecha se você for o último). Continuar?",
      confirmar: "Fechar fila",
      destrutivo: true,
    });
    if (ok) aplicarAceitando(false);
  };

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
      // "Fora" com a fila aberta nao existe: e promessa falsa para o cliente,
      // que le fila aberta como "pode entrar" (regra do Andre, 09/09). Ver
      // src/lib/coerenciaFila.ts. Intervalo NAO fecha — quem faz intervalo volta.
      if (fechaFilaAoSair(next, aceitandoNovos)) {
        await setAcceptingNew(false);
        await avisar({
          titulo: "Fila fechada junto",
          mensagem:
            "Como você saiu, a fila parou de aceitar novos clientes — ninguém entra numa fila sem quem atenda. Quem já estava esperando continua na lista.",
        });
      }
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
  const startClient = async (att: AttendanceInQueue, advance: boolean) => {
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
      // Modelo B (spec 28/06): fila continua e este atendimento cruzaria o
      // horario da refeicao -> adiantar (refeicao agora) ou adiar (depois dele).
      // Sem cruzamento a refeicao encaixa sozinha; fora da janela o backend suprime.
      const agora = new Date();
      const nowMin = agora.getHours() * 60 + agora.getMinutes();
      const duracao = duracaoDoAtendimento(att);
      const cruzada = refeicaoCruzada(meals, nowMin, duracao);
      if (cruzada) {
        const nome = mealName(cruzada.description);
        const adiantar = await confirmar({
          titulo: `${nome} às ${parseApiTime(cruzada.fixedStartTime)}`,
          mensagem: `O atendimento de ${att.clientName} (~${duracao}min) passa do horário do ${nome.toLowerCase()}. Adiantar: ${nome.toLowerCase()} agora (${cruzada.durationMinutes}min) e ${att.clientName} depois. Adiar: atende ${att.clientName} e o ${nome.toLowerCase()} vem em seguida.`,
          confirmar: `Adiantar ${nome.toLowerCase()}`,
          cancelar: "Adiar",
        });
        if (adiantar) handleStartMeal(cruzada);
        else doStart();
        return;
      }
      doStart();
      return;
    }
    const msg = runningName
      ? `Isso finaliza o atendimento de ${runningName} e ${advance ? `atende ${att.clientName} na frente da fila` : `inicia ${att.clientName}`}. Continuar?`
      : `${att.clientName} será atendido agora, na frente da fila. Tem certeza?`;
    const ok = await confirmar({
      titulo: advance ? "Adiantar cliente" : "Iniciar atendimento",
      mensagem: msg,
      confirmar: advance ? "Adiantar" : "Iniciar",
    });
    if (ok) doStart();
  };

  // "Nao chegou": o cliente da vez cai uma posicao e vira ATRASADO (repetivel,
  // sem teto). O proximo passa a ser o 1o.
  const confirmLate = async (att: AttendanceInQueue) => {
    const ok = await confirmar({
      titulo: "Cliente não chegou",
      mensagem: mensagemDoAtraso(att.clientName),
    });
    if (ok) handleAction(() => markLate(att.id));
  };

  // "Remover": acao do profissional (status REMOVIDO). Sem pre-requisito — pode
  // remover a qualquer momento, inclusive no 1o atraso.
  const confirmRemove = async (att: AttendanceInQueue) => {
    const ok = await confirmar({
      titulo: "Remover da fila",
      mensagem: `Remover ${att.clientName}?`,
      confirmar: "Remover",
      destrutivo: true,
    });
    if (ok) handleAction(() => removeFromQueue(att.id));
  };

  // "Promover ao topo" (S4): reordena ao 1o lugar SEM iniciar — os demais descem
  // e o cliente vira o proximo. Diferente de "Adiantar", que inicia na hora.
  const confirmPromote = async (att: AttendanceInQueue) => {
    const ok = await confirmar({
      titulo: "Promover ao topo",
      mensagem: `${att.clientName} vai para o 1o lugar da fila, sem iniciar o atendimento. Continuar?`,
      confirmar: "Promover",
    });
    if (ok) handleAction(() => promoteAttendance(att.id));
  };

  // Abrir/fechar o ESTABELECIMENTO pelo menu ☰ (pedido Andre 2026-07-18). O
  // backend aceita profissional afiliado no PATCH /open-status; o gate de fechar
  // com fila ativa (409 ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES) e tratado pelo
  // handleAction, que traduz a mensagem.
  // C2: contagem de encaixes pendentes pelo hook compartilhado — a MESMA
  // queryKey do rodape e da tela de Encaixes, entao e um cache so. O WS
  // pessoal (eventos CUT_*, assinado no useQueueSocket) invalida; o refetch
  // de 30s e o fallback p/ socket caido.
  const {
    count: pendingCutRequests,
    pending: pedidosPendentes,
    nowMs: agoraDosPedidos,
  } = usePendingCutRequests();
  // O resumo mora aqui e nao no card: card que calcula nao da pra testar sem
  // montar tela. O relogio vem do hook — `Date.now()` no render e impuro
  // (react-hooks/purity), e o "expira em N" tem que medir contra o mesmo
  // instante que filtrou os expirados. Ver resumoDeSolicitacoes.
  const resumoSolicitacoes = resumoDeSolicitacoes(pedidosPendentes, agoraDosPedidos);

  const runMenuAction = (action: QueueAction, att: AttendanceInQueue) => {
    if (action === "iniciar") startClient(att, false);
    else if (action === "adiantar") startClient(att, true);
    else if (action === "promover") confirmPromote(att);
    else if (action === "nao-chegou") confirmLate(att);
    else if (action === "remover") confirmRemove(att);
    // As tres de quem JA esta na cadeira. Elas nao existiam: o menu era por
    // posicao, e quem esta sendo atendido nao tem posicao na espera.
    else if (action === "finalizar")
      handleAction(async () => {
        await finalizarAtendimento(att.id, att.status === "PAUSED", {
          retomar: resumeAttendance,
          finalizar: finishAttendance,
        });
        clearAttendanceStart(att.id);
      });
    else if (action === "pausar") handleAction(() => pauseAttendance(att.id));
    else if (action === "retomar") handleAction(() => resumeAttendance(att.id));
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
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={rolagemRef}
          onScroll={pilula.onScroll}
          scrollEventThrottle={64}
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
              {/* 🔴 Na WEB nao existe puxar-para-atualizar: o gesto e de dedo, e o
                  RefreshControl do react-native-web nao responde ao mouse. Sem
                  isto, quem usa o navegador nao tinha NENHUMA forma de forcar a
                  atualizacao da fila — so recarregar a pagina inteira e perder o
                  lugar (device, 08/09). No aparelho o gesto continua sendo o
                  caminho, entao o botao nao aparece la. */}
              {Platform.OS === "web" && (
                <Pressable
                  onPress={onRefresh}
                  accessibilityRole="button"
                  accessibilityLabel="Atualizar a fila"
                  testID="atualizar-fila"
                  hitSlop={8}
                  disabled={refreshing}
                  className={refreshing ? "opacity-40" : undefined}
                >
                  <RotateCw size={20} color="#163300" />
                </Pressable>
              )}
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
            <View className="flex-row items-center gap-1.5 mt-1">
              <Star size={13} color="#454745" fill="#454745" />
              <Text className="font-body text-sm text-vupth-textSecondary">
                {ratingLabel(myProfessional.rating_average, myProfessional.rating_count)} · sua avaliação
              </Text>
            </View>
          )}
  
          {/* Atendimento em andamento manda na tela: vem ANTES de tudo. */}
          {/* O card inteiro abre o menu, alem dos botoes: quem tentou finalizar
              pelo MENU (e nao pelos botoes) tem que achar as acoes onde procurou —
              foi ali que o Andre procurou por quatro rodadas. */}
          {currentAttendance && (
            <Pressable
              // Toque simples TAMBEM abre (Andre, 24/09): so segurar ninguem
              // descobria — "nem eu sabia". Os botoes de dentro (Pausar,
              // Finalizar) continuam agindo sozinhos: o toque vai ao mais fundo.
              onPress={() => setMenuTarget(currentAttendance)}
              onLongPress={() => setMenuTarget(currentAttendance)}
              accessibilityRole="button"
              accessibilityLabel={`Opções de ${currentAttendance.clientName}`}
              accessibilityHint="Abre Finalizar, Pausar e Remover"
            >
            <ServingCard
              attendance={currentAttendance}
              onFinish={() =>
                handleAction(async () => {
                  // Pausado nao finaliza (S36): retoma e finaliza, em vez de
                  // deixar o profissional preso num botao que e recusado.
                  await finalizarAtendimento(
                    currentAttendance.id,
                    currentAttendance.status === "PAUSED",
                    { retomar: resumeAttendance, finalizar: finishAttendance }
                  );
                  clearAttendanceStart(currentAttendance.id);
                })
              }
              onPause={() => handleAction(() => pauseAttendance(currentAttendance.id))}
              onResume={() => handleAction(() => resumeAttendance(currentAttendance.id))}
            />
            </Pressable>
          )}
  
          {/* O pedido de encaixe estava so num ponto de 12px no menu ☰ — e o
              profissional nao olha o menu, olha a FILA. Fica depois do
              atendimento em curso (que sempre manda) e ANTES da lista de espera,
              porque tem relogio proprio: 5 minutos, e some sozinho. */}
          {resumoSolicitacoes && (
            <SolicitacoesCard
              resumo={resumoSolicitacoes}
              onPress={() => router.push("/(professional)/cut-requests" as any)}
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
                <Users size={13} color="#163300" />
                <Text className="font-heading text-xs text-vupth-forest">
                  {myProfessional.queue_count} na fila
                </Text>
              </View>
              <View className="flex-row items-center gap-1 bg-vupth-greenTint rounded-full px-3 py-1.5">
                <Clock size={13} color="#163300" />
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
              <UtensilsCrossed size={17} color="#163300" />
              <View className="flex-1">
                <Text className="font-heading text-sm text-vupth-forest">
                  {mealName(activeMeal.description)} em andamento
                </Text>
                <Text className="font-body text-xs text-vupth-textSecondary">
                  {[rotuloRefeicaoIniciada(activeMeal), `${activeMeal.durationMinutes}min previstos`]
                    .filter(Boolean)
                    .join(" • ")}
                </Text>
              </View>
              {/* Faixa pessego = fundo ja colorido: e o caso do Button/Secondary
                  do desenho. Antes o fundo vinha por className e brigava com o
                  verde do `primary` — o mesmo conflito que escondia o Finalizar. */}
              <NwButton
                title="Encerrar"
                onPress={() => handleFinishMeal(activeMeal)}
                variant="vupthSecondary"
                className="h-9 px-4"
              />
            </View>
          )}
  
          {/* DS3 (c) — a chave de "aceitando novos" fica no PE da lista, nao no
              cabecalho: nao e um estado meu (isso e a pilula), e uma propriedade
              da fila — e a decisao nasce olhando o fim dela. */}
          {!isLoading && myProfessional && (
            <AceitandoNovos aceitando={aceitandoNovos} onToggle={alternarAceitando} />
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
            <EstadoVazio
              doodle="fila"
              titulo="Nenhum cliente na fila"
              texto="Novos clientes aparecerão aqui automaticamente."
              className="mt-6"
            />
          )}
  
        </View>
        </ScrollView>
        <PilulaVoltarAoTopo visivel={pilula.visivel} onPress={pilula.subir} />
      </View>

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
              {/* DS4 (opcao A, 31/08): o texto QUEBRA em vez de vazar. Com a
                  fonte do sistema ampliada ele nao cabe numa linha, e a pilula
                  tem altura fixa — o icone saia da caixa e a frase era cortada.
                  `flex-shrink` deixa o texto ceder largura ao icone; sem ele o
                  Text nao encolhe e empurra o icone pra fora. */}
              <Text className="font-body text-sm text-vupth-textSecondary flex-shrink text-center">
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
                {queueMenuActions(menuIsFirst, menuTarget.status).map((action) => (
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
