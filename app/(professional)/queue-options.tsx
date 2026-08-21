import { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@components/Header";
import { QueueOptions } from "@components/QueueOptions";
import { useProfessionalStore } from "@store/professional.store";
import { useAttendanceStore } from "@store/attendance.store";
import { useIntervalStore, mealName } from "@store/interval.store";
import { useProfessionalsWithQueueQuery } from "@hooks/useQueuePolling";
import { getApiErrorMessage } from "@lib/api";
import { parseApiTime } from "@lib/time";
import { mealSignal } from "@lib/meals";
import { activeCutRequests } from "@lib/cutRequests";

// Tela "OPCOES DA FILA" (nav v2, 2026-07-23): o banco no header da Fila NAVEGA
// para ca (nada de modal — "mais amigavel a tela inteira"). So acoes do dia; o
// rodape (Fila/Relatorios/Configuracoes) segue visivel na aba Fila.
export default function QueueOptionsScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  const updateMyStatus = useProfessionalStore((s) => s.updateMyStatus);
  const setAcceptingNew = useProfessionalStore((s) => s.setAcceptingNew);
  const { fetchCutRequests } = useAttendanceStore();
  const intervals = useIntervalStore((s) => s.intervals);
  const fetchIntervals = useIntervalStore((s) => s.fetchIntervals);
  const fetchMyServices = useProfessionalStore((s) => s.fetchMyServices);

  const establishmentId = professional?.establishment_id ?? null;
  const profId = professional?.id;
  const { data, refetch: refetchQueue } = useProfessionalsWithQueueQuery(establishmentId);

  useEffect(() => {
    if (!profId || !establishmentId) return;
    fetchIntervals(profId).catch(() => {});
    // Os NOMES dos servicos do pedido saem daqui (o response so traz ids). A
    // Fila carregava e esta tela herdava pelo store — aberta direto, o card
    // caia em "Servico nao identificado". A tela de Encaixes (destino da linha
    // "Solicitacoes" abaixo) herda o mesmo store, entao continua valendo la.
    fetchMyServices().catch(() => {});
  }, [profId, establishmentId, fetchIntervals, fetchMyServices]);

  // ---- Status (S1) ----
  const WORK_TO_KEY = { WORKING: "trabalhando", ON_BREAK: "intervalo", OFF: "indisponivel" } as const;
  const KEY_TO_WORK = { trabalhando: "WORKING", intervalo: "ON_BREAK", indisponivel: "OFF" } as const;
  const myProfessional = data?.professionals?.find((p) => p.id === profId);
  const hasQueue = !!myProfessional?.current_attendance || (myProfessional?.waiting_list?.length ?? 0) > 0;

  // Decisao Andre 2026-07-24: o profissional NAO abre/fecha a loja na mao — ele
  // so muda o proprio status. A loja e DERIVADA (backend S1 f2): ficar
  // "Trabalhando" sendo o primeiro a abre; "Fora" sendo o ultimo a fecha. Aqui
  // so AVISAMOS, comparando o open_status antes/depois (o resultado real do
  // derivado, sem adivinhar quem e o ultimo).
  const selectStatus = async (next: keyof typeof KEY_TO_WORK) => {
    const wasOpen = data?.open_status === "OPEN";
    try {
      await updateMyStatus(KEY_TO_WORK[next]);
      const fresh = await refetchQueue();
      const nowOpen = fresh.data?.open_status === "OPEN";
      if (!wasOpen && nowOpen && next === "trabalhando") {
        Alert.alert(
          "Loja aberta",
          "Voce foi o primeiro a comecar — a loja agora aparece para os clientes e recebe a fila."
        );
      } else if (wasOpen && !nowOpen) {
        Alert.alert(
          "Loja fechada",
          "Voce era o ultimo em atividade — a loja foi fechada para os clientes."
        );
      }
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel mudar o status."));
    }
  };

  const statusControl = {
    current: professional?.work_status ? WORK_TO_KEY[professional.work_status] : null,
    onSelect: selectStatus,
  };

  // ---- Fechar / reabrir fila (S1 fatia 3) ----
  // accepting_new ausente => tratamos como aceitando (fila aberta).
  const acceptingNew = professional?.accepting_new ?? true;
  const runToggleQueue = async (value: boolean) => {
    try {
      await setAcceptingNew(value);
      const fresh = await refetchQueue();
      // Fechar a fila sendo o ultimo dispara auto-OFF => a loja fecha (derivado).
      if (!value && fresh.data?.open_status !== "OPEN") {
        Alert.alert("Loja fechada", "Voce era o ultimo — a fila e a loja foram fechadas para os clientes.");
      }
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel atualizar a fila."));
    }
  };
  const toggleQueue = () => {
    if (acceptingNew) {
      Alert.alert(
        "Fechar fila",
        "Ninguem novo entra na sua fila. Quem ja esta continua sendo atendido; ao terminar o ultimo voce fica indisponivel (e a loja fecha se voce for o ultimo). Continuar?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Fechar fila", style: "destructive", onPress: () => runToggleQueue(false) },
        ]
      );
    } else {
      // Reabrir e imediato, sem confirmar (acao inofensiva).
      runToggleQueue(true);
    }
  };

  // ---- Refeicoes (sinal + rotulo) ----
  const meals = intervals.filter((i) => i.type === "RECURRENT");
  const currentMealSignal = mealSignal(meals, new Date().getHours() * 60 + new Date().getMinutes());
  const nextMeal = meals.find((m) => m.status === "SCHEDULED") ?? null;
  const mealLabel = nextMeal
    ? `${mealName(nextMeal.description)} ${parseApiTime(nextMeal.fixedStartTime) ?? ""}`.trim()
    : undefined;

  // ---- Solicitacoes de corte (mesma queryKey da tela de Encaixes: cache
  // compartilhado; o WS pessoal assinado no useQueueSocket invalida e o GET
  // refaz). So a CONTAGEM pro badge — a decisao (aceitar/recusar) mudou de um
  // bottom-sheet aqui dentro pra tela cheia "Encaixes" (Pencil PROF · 02,
  // mesma linha da decisao de nav v2 que tirou o menu-modal do banco).
  const [cutNowMs, setCutNowMs] = useState(() => Date.now());
  const { data: cutRequestsData } = useQuery({
    queryKey: ["cut-requests", profId],
    queryFn: async () => {
      const list = await fetchCutRequests();
      setCutNowMs(Date.now()); // callback de sistema externo: permitido
      return list;
    },
    enabled: !!profId && !!establishmentId,
    refetchInterval: 30000,
  });
  const pendingCutRequests = activeCutRequests(cutRequestsData, cutNowMs);

  return (
    <ScrollView className="w-full" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <View className="flex-1 py-12 px-6">
        <Header showBackButton onBack={() => router.navigate("/(professional)/queue" as any)} showRoleIcon={false} />

        <Text className="font-heading text-2xl text-gray-900 mt-8">Opcoes da fila</Text>

        <QueueOptions
          mealSignal={currentMealSignal}
          mealLabel={mealLabel}
          hasQueue={hasQueue}
          status={statusControl}
          closeQueue={{ acceptingNew, onToggle: toggleQueue }}
          pendingRequests={pendingCutRequests.length}
          onOpenRequests={() => router.push("/(professional)/cut-requests" as any)}
        />
      </View>
    </ScrollView>
  );
}
