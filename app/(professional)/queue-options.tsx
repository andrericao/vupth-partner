import { useState, useEffect } from "react";
import { VStack, HStack, Heading, Text, Pressable, ScrollView } from "@gluestack-ui/themed";
import { Alert, Modal } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@components/Header";
import { Button } from "@components/Button";
import { QueueOptions } from "@components/QueueOptions";
import { useProfessionalStore } from "@store/professional.store";
import { useAttendanceStore } from "@store/attendance.store";
import { useEstablishmentStore } from "@store/establishment.store";
import { useIntervalStore, mealName } from "@store/interval.store";
import { useProfessionalsWithQueueQuery } from "@hooks/useQueuePolling";
import { getApiErrorMessage } from "@lib/api";
import { parseApiTime } from "@lib/time";
import { mealSignal } from "@lib/meals";
import { activeCutRequests, minutesToExpire, cutRequestTitle } from "@lib/cutRequests";
import { cardShadow } from "@lib/styles";

// Tela "OPCOES DA FILA" (nav v2, 2026-07-23): o banco no header da Fila NAVEGA
// para ca (nada de modal — "mais amigavel a tela inteira"). So acoes do dia; o
// rodape (Fila/Meu dia/Configuracoes) segue visivel na aba Fila.
export default function QueueOptionsScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  const updateMyStatus = useProfessionalStore((s) => s.updateMyStatus);
  const updateOpenStatus = useEstablishmentStore((s) => s.updateOpenStatus);
  const { acceptCutRequest, refuseCutRequest, fetchCutRequests } = useAttendanceStore();
  const intervals = useIntervalStore((s) => s.intervals);
  const fetchIntervals = useIntervalStore((s) => s.fetchIntervals);

  const establishmentId = professional?.establishment_id ?? null;
  const profId = professional?.id;
  const { data, refetch: refetchQueue } = useProfessionalsWithQueueQuery(establishmentId);

  const [showCutRequests, setShowCutRequests] = useState(false);

  useEffect(() => {
    if (profId && establishmentId) fetchIntervals(profId).catch(() => {});
  }, [profId, establishmentId, fetchIntervals]);

  const handleAction = async (action: () => Promise<unknown>) => {
    try {
      await action();
      await refetchQueue();
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Erro ao executar acao."));
    }
  };

  // ---- Status (S1 fatia 1) ----
  const WORK_TO_KEY = { WORKING: "trabalhando", ON_BREAK: "intervalo", OFF: "indisponivel" } as const;
  const KEY_TO_WORK = { trabalhando: "WORKING", intervalo: "ON_BREAK", indisponivel: "OFF" } as const;
  const myProfessional = data?.professionals?.find((p) => p.id === profId);
  const hasQueue = !!myProfessional?.current_attendance || (myProfessional?.waiting_list?.length ?? 0) > 0;
  const statusControl = {
    current: professional?.work_status ? WORK_TO_KEY[professional.work_status] : null,
    onSelect: (next: keyof typeof KEY_TO_WORK) => handleAction(() => updateMyStatus(KEY_TO_WORK[next])),
  };

  // ---- Abrir estabelecimento (profissional NAO fecha — decisao 2026-07-23) ----
  const isEstablishmentOpen = data?.open_status === "OPEN";
  const isEstablishmentOpenNow = data?.is_open ?? isEstablishmentOpen;
  const openEstablishment = () => {
    if (!establishmentId || isEstablishmentOpen) return;
    Alert.alert(
      "Abrir estabelecimento",
      "A loja passa a aparecer para os clientes e a receber novos na fila. Continuar?",
      [
        { text: "Cancelar" },
        { text: "Abrir", onPress: () => handleAction(() => updateOpenStatus(establishmentId, "OPEN")) },
      ]
    );
  };

  // ---- Refeicoes (sinal + rotulo) ----
  const meals = intervals.filter((i) => i.type === "RECURRENT");
  const currentMealSignal = mealSignal(meals, new Date().getHours() * 60 + new Date().getMinutes());
  const nextMeal = meals.find((m) => m.status === "SCHEDULED") ?? null;
  const mealLabel = nextMeal
    ? `${mealName(nextMeal.description)} ${parseApiTime(nextMeal.fixedStartTime) ?? ""}`.trim()
    : undefined;

  // ---- Solicitacoes de corte (mesma queryKey da Fila: cache compartilhado;
  // o WS pessoal assinado no useQueueSocket invalida e o GET refaz) ----
  const [cutNowMs, setCutNowMs] = useState(() => Date.now());
  const { data: cutRequestsData, refetch: refetchCutRequests } = useQuery({
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
  const myServices = useProfessionalStore((s) => s.myServices);

  const decideCutRequest = (cutRequestId: string, accept: boolean) =>
    handleAction(async () => {
      if (accept) await acceptCutRequest(cutRequestId);
      else await refuseCutRequest(cutRequestId);
      await refetchCutRequests();
    });

  return (
    <ScrollView w="$full" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton onBack={() => router.navigate("/(professional)/queue" as any)} showRoleIcon={false} />

        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Opcoes da fila
        </Heading>

        <QueueOptions
          mealSignal={currentMealSignal}
          mealLabel={mealLabel}
          hasQueue={hasQueue}
          status={statusControl}
          establishment={
            establishmentId
              ? { isOpen: isEstablishmentOpen, isOpenNow: isEstablishmentOpenNow, onOpen: openEstablishment }
              : undefined
          }
          pendingRequests={pendingCutRequests.length}
          onOpenRequests={() => {
            setCutNowMs(Date.now());
            setShowCutRequests(true);
          }}
        />

        {/* Solicitacoes de corte: pedidos com a fila fechada, aguardando decisao. */}
        <Modal
          visible={showCutRequests}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCutRequests(false)}
        >
          <VStack flex={1} justifyContent="flex-end">
            <Pressable
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)" }}
              onPress={() => setShowCutRequests(false)}
              accessibilityLabel="Fechar solicitacoes"
            />
            <VStack bg="$white" borderTopLeftRadius="$2xl" borderTopRightRadius="$2xl" p="$4" pb="$8" space="sm">
              <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray700" mb="$1">
                Solicitacoes de corte
              </Text>
              {pendingCutRequests.length === 0 ? (
                <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
                  Nenhuma solicitacao pendente.
                </Text>
              ) : (
                pendingCutRequests.map((req) => (
                  <VStack key={req.id} bg="$coolGray50" borderRadius="$xl" p="$3" space="xs" style={cardShadow}>
                    <Text fontFamily="$heading" fontWeight="$bold" fontSize="$sm" color="$coolGray900">
                      {cutRequestTitle(req, myServices)}
                    </Text>
                    <Text fontFamily="$body" fontSize="$xs" color="$amber600">
                      expira em {minutesToExpire(req.expires_at, cutNowMs)} min — sem resposta, e negado sozinho
                    </Text>
                    <HStack space="sm" mt="$1">
                      <Button
                        title="Recusar"
                        onPress={() => {
                          setShowCutRequests(false);
                          decideCutRequest(req.id, false);
                        }}
                        bg="$coolGray200"
                        textColor="$coolGray700"
                        h="$9"
                        mt="$0"
                        flex={1}
                      />
                      <Button
                        title="Aceitar"
                        onPress={() => {
                          setShowCutRequests(false);
                          decideCutRequest(req.id, true);
                        }}
                        bg="$green500"
                        $active-bg="$green600"
                        h="$9"
                        mt="$0"
                        flex={1}
                      />
                    </HStack>
                  </VStack>
                ))
              )}
              <Pressable
                onPress={() => setShowCutRequests(false)}
                py="$3"
                accessibilityRole="button"
                accessibilityLabel="Fechar lista de solicitacoes"
              >
                <Text fontFamily="$body" fontSize="$md" color="$coolGray500" textAlign="center">
                  Fechar
                </Text>
              </Pressable>
            </VStack>
          </VStack>
        </Modal>
      </VStack>
    </ScrollView>
  );
}
