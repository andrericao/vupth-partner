import { useState } from "react";
import { View, Text, ScrollView, RefreshControl, Alert } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react-native";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwButton } from "@components/nw/Button";
import { useProfessionalStore } from "@store/professional.store";
import { useAttendanceStore } from "@store/attendance.store";
import {
  activeCutRequests,
  minutesToExpire,
  cutRequestServices,
  cutRequestClientName,
  cutRequestTotal,
} from "@lib/cutRequests";
import { hhmmFromIso } from "@lib/time";
import { getApiErrorMessage } from "@lib/api";
import { formatCurrency } from "@utils/summaryCalculations";

// Tela "Encaixes" (Pencil PROF · 02): mesma feature de C2 (solicitacoes de
// corte) que ja funcionava dentro de um bottom-sheet em "Opcoes da fila"
// (queue-options.tsx) — promovida a TELA CHEIA pelo desenho, na mesma linha
// da decisao de nav v2 (Andre 2026-07-23: "tela inteira e mais amigavel que
// modal"). Store/logica identicas; so o layout e novo. Acessada pela linha
// "Solicitacoes" em Opcoes da fila (so aparece com pedido pendente).
export default function CutRequestsScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  const myServices = useProfessionalStore((s) => s.myServices);
  const { acceptCutRequest, refuseCutRequest, fetchCutRequests } = useAttendanceStore();

  const establishmentId = professional?.establishment_id ?? null;
  const profId = professional?.id;

  // Relogio ancorado em estado, nao em Date.now() no render (react-hooks/purity;
  // mesmo padrao de queue.tsx/queue-options.tsx) — atualiza a cada fetch,
  // granularidade de sobra p/ um TTL de 5min (nao ha countdown ao segundo em
  // lugar nenhum do app para solicitacoes de corte, de proposito).
  const [nowMs, setNowMs] = useState(() => Date.now());
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["cut-requests", profId],
    queryFn: async () => {
      const list = await fetchCutRequests();
      setNowMs(Date.now());
      return list;
    },
    enabled: !!profId && !!establishmentId,
    refetchInterval: 30000,
  });
  const pending = activeCutRequests(data, nowMs);

  const [busyId, setBusyId] = useState<string | null>(null);
  const decide = async (id: string, accept: boolean) => {
    setBusyId(id);
    try {
      if (accept) await acceptCutRequest(id);
      else await refuseCutRequest(id);
      // Sem Date.now() aqui (react-hooks/purity barra fora do queryFn): o
      // refetch ja reexecuta o queryFn abaixo, que atualiza nowMs sozinho.
      await refetch();
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel decidir a solicitacao."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ScrollView
      className="flex-1 w-full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader
          title="Encaixes"
          subtitle="Sem resposta, o pedido é negado sozinho."
          onBack={() => router.back()}
        />

        <View className="px-4 gap-3">
          {pending.length === 0 ? (
            <View className="bg-vupth-surface rounded-[20px] p-6 items-center gap-2 mt-2">
              <Clock size={22} color="#9CA3AF" />
              <Text className="font-body text-sm text-gray-500 text-center">
                Nenhum pedido de encaixe no momento.
              </Text>
            </View>
          ) : (
            pending.map((req) => {
              const mins = minutesToExpire(req.expires_at, nowMs);
              const urgent = mins <= 2;
              const who = cutRequestClientName(req);
              const services = cutRequestServices(req.service_item_ids, myServices);
              const total = cutRequestTotal(req.service_item_ids, myServices);
              const time = hhmmFromIso(req.created_at);
              const busy = busyId === req.id;

              return (
                <View
                  key={req.id}
                  className="bg-vupth-surface rounded-[20px] p-4 gap-3"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="font-display text-base text-vupth-forest">{who}</Text>
                      <Text className="font-body text-xs text-gray-500 mt-0.5">
                        {services}
                        {total > 0 ? ` · ${formatCurrency(total)}` : ""}
                      </Text>
                    </View>
                    <View
                      className={`flex-row items-center gap-1 px-2.5 h-6 rounded-full ${
                        urgent ? "bg-vupth-danger" : "bg-white border border-vupth-border"
                      }`}
                    >
                      <Clock size={12} color={urgent ? "#FFFFFF" : "#454745"} />
                      <Text
                        className={`font-mono text-[11px] ${urgent ? "text-white" : "text-gray-500"}`}
                      >
                        {mins} min
                      </Text>
                    </View>
                  </View>

                  {time && (
                    <Text className="font-body text-[11px] text-gray-500">
                      Pediu às {time} · entra no fim da sua fila
                    </Text>
                  )}

                  <View className="flex-row gap-2">
                    <NwButton
                      title="Recusar"
                      variant="secondary"
                      className="flex-1 h-9 mt-0"
                      disabled={busy}
                      onPress={() => decide(req.id, false)}
                    />
                    <NwButton
                      title="Aceitar"
                      className="flex-1 h-9 mt-0"
                      disabled={busy}
                      onPress={() => decide(req.id, true)}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}
