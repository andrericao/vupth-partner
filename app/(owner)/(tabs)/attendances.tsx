import { useState, useCallback, useEffect } from "react";

import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { SkeletonList } from "@components/Skeleton";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { useAttendanceStore } from "@store/attendance.store";
import { useEstablishmentStore } from "@store/establishment.store";
import type { AttendanceHistoryItem } from "@lib/types";
import { getApiErrorMessage } from "@lib/api";
import { seloDoStatus, observacaoDoAtendimento } from "@lib/statusAtendimento";
import { LinhaDoPagamento } from "@components/LinhaDoPagamento";
import { confirmarRecebimento, formatarReais, perguntarForma } from "@lib/pagamento";
import { confirmar } from "@lib/confirmar";

function AttendanceHistoryCard({
  item,
  onRecebi,
}: {
  item: AttendanceHistoryItem;
  onRecebi: (item: AttendanceHistoryItem) => Promise<void>;
}) {
  // Rotulo e cor vem da lib compartilhada com o Meu dia — inclusive o REMOVED
  // (a loja retirou), que antes cairia cru na tela.
  const statusInfo = seloDoStatus(item.status);
  const date = new Date(item.scheduledTime);
  const dateStr = `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <View className="bg-vupth-surface p-4 rounded-card mb-3">
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="font-heading text-vupth-textPrimary">{item.clientName}</Text>
          <Text className="font-body text-xs text-vupth-textSecondary">
            Prof: {item.professionalName}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-md ${statusInfo.selo}`}>
          <Text className={`font-body text-xs ${statusInfo.texto}`}>{statusInfo.label}</Text>
        </View>
      </View>

      <Text className="font-body text-xs text-vupth-textSecondary mt-1">
        {dateStr}
        {item.durationInMinutes != null && ` — ${item.durationInMinutes}min`}
      </Text>

      {observacaoDoAtendimento(item) && (
        <Text testID="observacao-do-atendimento" className="font-body text-xs text-vupth-textSecondary mt-1">
          {observacaoDoAtendimento(item)}
        </Text>
      )}

      <Text className="font-body text-sm text-vupth-textSecondary mt-1">
        {item.services.map((sv) => sv.customName).join(", ")}
      </Text>

      <View className="flex-row justify-end mt-2">
        <Text className="font-heading text-vupth-textPrimary">{formatarReais(item.totalValue)}</Text>
      </View>
      {/* pagamento-pix (contrato 2a2b0ec): o dono tambem marca "Recebi". */}
      <LinhaDoPagamento status={item.payment_status} onRecebi={() => onRecebi(item)} />
    </View>
  );
}

type Filter = "ALL" | "FINISHED" | "CANCELLED" | "REMOVED";

export default function OwnerAttendancesScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const history = useAttendanceStore((s) => s.history);
  const fetchHistory = useAttendanceStore((s) => s.fetchHistory);

  const [filter, setFilter] = useState<Filter>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const loadHistory = useCallback(async () => {
    if (!establishment?.id) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const params: Record<string, string> = { establishmentId: establishment.id };
      if (filter !== "ALL") params.status = filter;
      await fetchHistory(params);
      setLoaded(true);
    } catch (error: any) {
      const msg = getApiErrorMessage(error, "Não foi possível carregar os atendimentos.");
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  }, [establishment?.id, filter, fetchHistory]);

  useEffect(() => {
    // loadHistory faz fetch on-mount/filtro e sinaliza isLoading — padrao
    // intencional de carregamento (nao e cascata de render).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, [loadHistory]);

  const recebi = async (item: AttendanceHistoryItem) => {
    const ok = await confirmar({
      titulo: "Recebeu o pagamento?",
      mensagem: `Confirme que ${item.clientName} pagou ${formatarReais(item.totalValue)}.`,
      confirmar: "Recebi",
    });
    if (!ok) return;
    const forma = await perguntarForma();
    try {
      await confirmarRecebimento(item.id, forma);
      await loadHistory();
    } catch (error: any) {
      setErrorMsg(getApiErrorMessage(error, "Não foi possível confirmar o pagamento."));
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  const filters: { key: Filter; label: string }[] = [
    { key: "ALL", label: "Todos" },
    { key: "FINISHED", label: "Finalizados" },
    { key: "CANCELLED", label: "Cancelados" },
    // A loja retirou (backend, 18/09) — separado de quem desistiu.
    { key: "REMOVED", label: "Retirados" },
  ];

  const totalRevenue = history
    .filter((a) => a.status === "FINISHED")
    .reduce((sum, a) => sum + a.totalValue, 0);

  return (
    <ScrollView
      className="w-full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader
          title="Atendimentos"
          subtitle={establishment?.name ?? undefined}
          onBack={() => router.navigate("/(owner)/menu" as any)}
        />

        <View className="flex-row gap-2 mt-4 mb-4">
          {filters.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={`py-2 px-4 rounded-full shrink-0 ${
                filter === f.key ? "bg-vupth-selecionado" : "bg-vupth-surface"
              }`}
            >
              <Text
                numberOfLines={1}
                className={`font-body text-sm text-center ${
                  filter === f.key ? "text-vupth-onSelecionado" : "text-vupth-textSecondary"
                }`}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading && (
          <View className="mt-6">
            <SkeletonList count={3} />
          </View>
        )}

        {errorMsg && (
          <View className="bg-vupth-surface p-4 rounded-card mt-4">
            <Text className="font-body text-vupth-danger text-center">{errorMsg}</Text>
            <Pressable onPress={loadHistory} className="mt-2">
              <Text className="font-body text-sm text-vupth-textPrimary text-center">
                Tentar novamente
              </Text>
            </Pressable>
          </View>
        )}

        {loaded && !errorMsg && history.length > 0 && (
          <View className="bg-vupth-greenTint p-3 rounded-card mb-4">
            <View className="flex-row justify-between items-center">
              <Text className="font-body text-sm text-vupth-onGreenTint">
                {history.length} atendimento{history.length !== 1 ? "s" : ""}
              </Text>
              <Text className="font-heading text-vupth-onGreenTint">
                {formatarReais(totalRevenue)}
              </Text>
            </View>
          </View>
        )}

        {loaded && !errorMsg && history.length === 0 && (
          <Text className="font-body text-vupth-textSecondary text-center mt-12">
            Nenhum atendimento encontrado
          </Text>
        )}

        {loaded && !errorMsg && history.length > 0 && (
          <View>
            <View className="h-px bg-vupth-border mb-4" />
            {history.map((item) => (
              <AttendanceHistoryCard key={item.id} item={item} onRecebi={recebi} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
