import { useEffect, useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { QueueOptions } from "@components/QueueOptions";
import { ModoDeFuncionamento, type Modo } from "@components/ModoDeFuncionamento";
import { ExporPosicao } from "@components/ExporPosicao";
import { useProfessionalStore } from "@store/professional.store";
import { viraTrabalhandoAoAbrirFila, fechaFilaAoSair } from "@lib/coerenciaFila";
import { useIntervalStore, mealName } from "@store/interval.store";
import { useProfessionalsWithQueueQuery } from "@hooks/useQueuePolling";
import { usePendingCutRequests } from "@hooks/usePendingCutRequests";
import { getApiErrorMessage } from "@lib/api";
import { parseApiTime } from "@lib/time";
import { mealSignal, refeicoesDoDia } from "@lib/meals";
import { confirmar, avisar } from "@lib/confirmar";

// Tela "OPCOES DA FILA" (nav v2, 2026-07-23): o banco no header da Fila NAVEGA
// para ca (nada de modal — "mais amigavel a tela inteira"). So acoes do dia; o
// rodape (Fila/Encaixes/Relatorios/Perfil) segue visivel na aba Fila.
export default function QueueOptionsScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  const updateMyStatus = useProfessionalStore((s) => s.updateMyStatus);
  const setAcceptingNew = useProfessionalStore((s) => s.setAcceptingNew);
  const setOperationMode = useProfessionalStore((s) => s.setOperationMode);
  const [trocandoModo, setTrocandoModo] = useState(false);
  // Fila e agenda x so agenda (D9; 8e6c00f), decidido antes de atender (Andre,
  // 26/09). Depois do 1o cliente do dia o backend responde 409 e a frase explica.
  const escolherModo = async (modo: Modo) => {
    setTrocandoModo(true);
    try {
      await setOperationMode(modo);
    } catch (error: any) {
      await avisar({
        titulo: "Funcionamento",
        mensagem: getApiErrorMessage(error, "Não foi possível mudar o funcionamento."),
      });
    } finally {
      setTrocandoModo(false);
    }
  };
  // expor-posicao (35d57c0): o cliente ve a posicao na fila; padrao, mostrar.
  const setShowPosition = useProfessionalStore((s) => s.setShowPosition);
  const [salvandoPosicao, setSalvandoPosicao] = useState(false);
  const mudarPosicao = async (expor: boolean) => {
    setSalvandoPosicao(true);
    try {
      await setShowPosition(expor);
    } catch (error: any) {
      await avisar({
        titulo: "Posição na fila",
        mensagem: getApiErrorMessage(error, "Não foi possível mudar a posição na fila."),
      });
    } finally {
      setSalvandoPosicao(false);
    }
  };
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
      // "Fora" com fila aberta nao existe (regra do Andre, 09/09) — mesma
      // decisao da tela da Fila, aplicada aqui para nao haver duas versoes.
      if (fechaFilaAoSair(next, acceptingNew)) {
        await setAcceptingNew(false);
        await avisar({
          titulo: "Fila fechada junto",
          mensagem:
            "Como você saiu, a fila parou de aceitar novos clientes. Quem já estava esperando continua na lista.",
        });
      }
      const fresh = await refetchQueue();
      const nowOpen = fresh.data?.open_status === "OPEN";
      if (!wasOpen && nowOpen && next === "trabalhando") {
        Alert.alert(
          "Loja aberta",
          "Você foi o primeiro a comecar — a loja agora aparece para os clientes e recebe a fila."
        );
      } else if (wasOpen && !nowOpen) {
        Alert.alert(
          "Loja fechada",
          "Você era o último em atividade — a loja foi fechada para os clientes."
        );
      }
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível mudar o status."));
    }
  };

  const statusControl = {
    current: professional?.work_status ? WORK_TO_KEY[professional.work_status] : null,
    onSelect: selectStatus,
  };

  // ---- Fechar / reabrir fila (S1 fatia 3) ----
  // accepting_new ausente => tratamos como aceitando (fila aberta).
  const acceptingNew = professional?.accepting_new ?? true;
  const statusKey = professional?.work_status
    ? WORK_TO_KEY[professional.work_status]
    : "trabalhando";
  const runToggleQueue = async (value: boolean) => {
    try {
      // Mesma regra da tela da Fila, no outro lugar que mexe no mesmo
      // interruptor: abrir a fila estando "Fora" recriaria o estado que nao
      // existe. Ver src/lib/coerenciaFila.ts.
      if (viraTrabalhandoAoAbrirFila(statusKey, value)) {
        await updateMyStatus("WORKING");
        await avisar({
          titulo: "Você voltou para a fila",
          mensagem: "Abrir a fila marca você como Trabalhando — não dá para receber cliente estando fora.",
        });
      }
      await setAcceptingNew(value);
      const fresh = await refetchQueue();
      // Fechar a fila sendo o ultimo dispara auto-OFF => a loja fecha (derivado).
      if (!value && fresh.data?.open_status !== "OPEN") {
        Alert.alert("Loja fechada", "Você era o último — a fila e a loja foram fechadas para os clientes.");
      }
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível atualizar a fila."));
    }
  };
  const toggleQueue = () => {
    if (acceptingNew) {
      confirmar({
        titulo: "Fechar fila",
        mensagem:
          "Ninguém novo entra na sua fila. Quem já está continua sendo atendido; ao terminar o último você fica indisponível (e a loja fecha se você for o último). Continuar?",
        confirmar: "Fechar fila",
        destrutivo: true,
      }).then((ok) => {
        if (ok) runToggleQueue(false);
      });
    } else {
      // Reabrir e imediato, sem confirmar (acao inofensiva).
      runToggleQueue(true);
    }
  };

  // ---- Refeicoes (sinal + rotulo) ----
  // Modelo B: a suprimida hoje nao acende o dot nem vira a "proxima".
  const meals = refeicoesDoDia(intervals.filter((i) => i.type === "RECURRENT"));
  const currentMealSignal = mealSignal(meals, new Date().getHours() * 60 + new Date().getMinutes());
  const nextMeal = meals.find((m) => m.status === "SCHEDULED") ?? null;
  const mealLabel = nextMeal
    ? `${mealName(nextMeal.description)} ${parseApiTime(nextMeal.fixedStartTime) ?? ""}`.trim()
    : undefined;

  // ---- Encaixes: contagem vem do hook compartilhado (mesma queryKey do
  // rodape e da tela de Encaixes — cache unico, sem requisicao extra).
  const { count: pendingCutRequests } = usePendingCutRequests();

  return (
    <ScrollView className="w-full" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader
          title="Opções da fila"
          onBack={() => router.navigate("/(professional)/queue" as any)}
        />

        <QueueOptions
          mealSignal={currentMealSignal}
          mealLabel={mealLabel}
          hasQueue={hasQueue}
          status={statusControl}
          closeQueue={{ acceptingNew, onToggle: toggleQueue }}
          pendingRequests={pendingCutRequests}
          onOpenRequests={() => router.push("/(professional)/cut-requests" as any)}
        />

        {professional?.establishment_id && (
          <View className="mt-6">
            <ModoDeFuncionamento
              atual={professional.operation_mode ?? "QUEUE"}
              onEscolher={escolherModo}
              ocupado={trocandoModo}
            />
            <View className="mt-3">
              <ExporPosicao
                expor={professional.show_position ?? true}
                onMudar={mudarPosicao}
                ocupado={salvandoPosicao}
              />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
