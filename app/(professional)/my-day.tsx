import { useState, useCallback, useEffect } from "react";
import { useVoltarAoTopo, usePilulaTopo } from "@hooks/useVoltarAoTopo";
import { PilulaVoltarAoTopo } from "@components/PilulaVoltarAoTopo";
import { useIsFocused } from "@react-navigation/native";
import { RefreshControl, View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { SkeletonList } from "@components/Skeleton";
import { ExpedienteCard } from "@components/ExpedienteCard";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { useAttendanceStore } from "@store/attendance.store";
import { useProfessionalStore, type ProfessionalReport } from "@store/professional.store";
import type { AttendanceHistoryItem } from "@lib/types";
import { getApiErrorMessage } from "@lib/api";
import { periodRange } from "@lib/time";
import { seloDoStatus } from "@lib/statusAtendimento";

// "MEU DIA" (2026-07-22) — unifica as antigas telas Relatorios + Atendimentos,
// como no mockup do menu ("atendidos, faturado, historico" num item so).
// - O seletor de PERIODO (Hoje/Semana/Mes) governa o RESUMO (GET
//   /professional/me/reports?dateFrom&dateTo).
// - O HISTORICO usa os proprios filtros de STATUS: o GET /attendances nao
//   aceita datas (so professionalId/status), entao nao fingimos um filtro de
//   periodo que o backend nao faz.
type Period = "day" | "week" | "month";
type Filter = "ALL" | "FINISHED" | "CANCELLED" | "REMOVED";


function humanizeService(value: string | null): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function AttendanceHistoryCard({ item }: { item: AttendanceHistoryItem }) {
  // Rotulo e cor vem da lib compartilhada com Atendimentos do dono —
  // inclusive o REMOVED (a loja retirou), que antes cairia cru na tela.
  const statusInfo = seloDoStatus(item.status);
  const date = new Date(item.scheduledTime);
  const dateStr = `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <View className="bg-vupth-surface p-4 rounded-card mb-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-heading text-vupth-forest">{item.clientName}</Text>
        <View className={`px-3 py-1 rounded-md ${statusInfo.selo}`}>
          <Text className={`font-body text-xs ${statusInfo.texto}`}>{statusInfo.label}</Text>
        </View>
      </View>

      <Text className="font-body text-xs text-vupth-textSecondary mt-1">
        {dateStr}
        {item.durationInMinutes != null && ` — ${item.durationInMinutes}min`}
      </Text>

      <Text className="font-body text-sm text-vupth-textSecondary mt-1">
        {item.services.map((s) => s.customName).join(", ")}
      </Text>

      <View className="flex-row justify-end mt-2">
        <Text className="font-heading text-vupth-forest">R$ {item.totalValue.toFixed(2)}</Text>
      </View>
    </View>
  );
}

/** Chip de escolha (periodo e filtro). Escolhido: forest com texto verde. */
function Chip({ label, ativo, onPress }: { label: string; ativo: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      className={`py-2 px-4 rounded-full active:opacity-70 ${ativo ? "bg-vupth-forest" : "bg-vupth-surface"}`}
    >
      <Text
        numberOfLines={1}
        className={`font-body text-sm text-center ${ativo ? "text-vupth-green" : "text-vupth-textSecondary"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Card de numero do resumo. `destaque` = o card-heroi (receita). */
function Numero({
  rotulo,
  valor,
  tamanho = "text-xxl",
  destaque = false,
}: {
  rotulo: string;
  valor: string | number;
  tamanho?: string;
  destaque?: boolean;
}) {
  return (
    <View className={`flex-1 p-4 rounded-card ${destaque ? "bg-vupth-green" : "bg-vupth-surface"}`}>
      <Text className={`font-body text-sm ${destaque ? "text-vupth-forest" : "text-vupth-textSecondary"}`}>
        {rotulo}
      </Text>
      <Text className={`font-heading ${tamanho} text-vupth-forest`}>{valor}</Text>
    </View>
  );
}

export default function MyDayScreen() {
  // Tocar na aba JA ATIVA volta ao topo (Andre, 18/09).
  const rolagemRef = useVoltarAoTopo();
  const pilula = usePilulaTopo(rolagemRef);

  const professional = useProfessionalStore((s) => s.professional);
  const isFocused = useIsFocused();
  const fetchMyReport = useProfessionalStore((s) => s.fetchMyReport);
  const history = useAttendanceStore((s) => s.history);
  const fetchHistory = useAttendanceStore((s) => s.fetchHistory);
  const { data } = useQueuePolling(professional?.establishment_id ?? null);

  const [period, setPeriod] = useState<Period>("day");
  const [report, setReport] = useState<ProfessionalReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [filter, setFilter] = useState<Filter>("ALL");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const myProfessional = data?.professionals?.find((p) => p.id === professional?.id);
  const queueCount = myProfessional?.queue_count ?? 0;
  const waitMinutes = myProfessional?.estimated_wait_minutes ?? 0;

  const loadReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const { dateFrom, dateTo } = periodRange(period);
      setReport(await fetchMyReport(dateFrom, dateTo));
    } catch {
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  }, [period, fetchMyReport]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const loadHistory = useCallback(async () => {
    if (!professional?.id) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const params: Record<string, string> = { professionalId: professional.id };
      if (filter !== "ALL") params.status = filter;
      await fetchHistory(params);
      setHistoryLoaded(true);
    } catch (error: any) {
      setHistoryError(getApiErrorMessage(error, "Não foi possível carregar os atendimentos."));
    } finally {
      setHistoryLoading(false);
    }
  }, [professional?.id, filter, fetchHistory]);

  // RECARREGA AO FOCAR (feedback de device 2026-08-11): "iniciei o atendimento,
  // na Fila aparecia 'atendendo agora' e aqui continuava AGENDADO". A causa e
  // que estas duas telas sao ABAS — o React Navigation nao remonta ao voltar,
  // entao o fetch on-mount rodava uma vez so e a lista envelhecia calada (o
  // "depois de um tempo atualizou" era outra remontagem). Com `isFocused` na
  // dependencia, voltar p/ Relatorios busca de novo.
  useEffect(() => {
    if (!isFocused) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReport();
  }, [loadReport, isFocused]);

  useEffect(() => {
    if (!isFocused) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, [loadHistory, isFocused]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadReport(), loadHistory()]);
    setRefreshing(false);
  }, [loadReport, loadHistory]);

  const periods: { key: Period; label: string }[] = [
    { key: "day", label: "Hoje" },
    { key: "week", label: "Semana" },
    { key: "month", label: "Mes" },
  ];

  const filters: { key: Filter; label: string }[] = [
    { key: "ALL", label: "Todos" },
    { key: "FINISHED", label: "Finalizados" },
    { key: "CANCELLED", label: "Cancelados" },
    // A loja retirou (backend, 18/09) — separado de quem desistiu.
    { key: "REMOVED", label: "Retirados" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={rolagemRef}
        onScroll={pilula.onScroll}
        scrollEventThrottle={64}
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="flex-1 pb-12 px-4">
          {/* [marca-vupth] Titulo do Pencil (PROF · 03) e "Seu dia" — bate com o
              conceito interno da tela ("MEU DIA", que uniu Relatórios +
              Atendimentos); "Relatórios" ficou só no rotulo da aba, mais curto
              pra caber no rodape. */}
          <ScreenHeader
            title="Seu dia"
            onBack={() => router.navigate("/(professional)/queue" as any)}
          />

          <View className="flex-row flex-wrap gap-2 mt-6">
            {periods.map((p) => (
              <Chip key={p.key} label={p.label} ativo={period === p.key} onPress={() => setPeriod(p.key)} />
            ))}
          </View>

          <ExpedienteCard />

          <View className="h-px bg-vupth-border my-6" />

          {period === "day" && (
            <View className="flex-row gap-3 mb-4">
              <Numero rotulo="Na fila agora" valor={queueCount} />
              <Numero rotulo="Espera estimada" valor={`${waitMinutes} min`} />
            </View>
          )}

          {reportLoading ? (
            <View className="mt-2">
              <SkeletonList count={2} />
            </View>
          ) : (
            <View className="gap-3">
              {/* [marca-vupth] Receita e o card-heroi (brandGreen, primeira
                  posição) — o Pencil (PROF · 03) da esse tratamento pro
                  faturado, o único número em dinheiro da tela. */}
              <View className="flex-row gap-3">
                <Numero
                  rotulo="Receita"
                  valor={`R$ ${Number(report?.totalRevenue ?? 0).toFixed(2)}`}
                  destaque
                />
                <Numero rotulo="Atendimentos" valor={report?.totalAttendances ?? 0} />
              </View>

              <View className="flex-row gap-3">
                <Numero
                  rotulo="Duracao media"
                  valor={`${Math.round(report?.avgDurationMinutes ?? 0)} min`}
                  tamanho="text-xl"
                />
                <Numero
                  rotulo="Serviço mais feito"
                  valor={humanizeService(report?.topService ?? null)}
                  tamanho="text-md"
                />
              </View>

              <Text className="font-body text-xs text-vupth-textSecondary text-center mt-2">
                {period === "day" ? "Hoje" : period === "week" ? "Ultimos 7 dias" : "Ultimos 30 dias"} •
                atendimentos finalizados
              </Text>
            </View>
          )}

          <View className="h-px bg-vupth-border my-6" />

          <Text className="font-heading text-xl text-vupth-forest mb-3">Historico</Text>

          <View className="flex-row flex-wrap gap-2 mb-4">
            {filters.map((f) => (
              <Chip key={f.key} label={f.label} ativo={filter === f.key} onPress={() => setFilter(f.key)} />
            ))}
          </View>

          {historyLoading && (
            <View className="mt-2">
              <SkeletonList count={3} />
            </View>
          )}

          {historyError && (
            <View className="bg-vupth-warning p-4 rounded-card mt-2">
              <Text className="font-body text-vupth-forest text-center">{historyError}</Text>
              <Pressable onPress={loadHistory} accessibilityRole="button" className="mt-2 active:opacity-70">
                <Text className="font-body text-sm text-vupth-forest text-center">Tentar novamente</Text>
              </Pressable>
            </View>
          )}

          {!historyLoading && historyLoaded && !historyError && history.length === 0 && (
            <Text className="font-body text-vupth-textSecondary text-center mt-6">
              Nenhum atendimento encontrado
            </Text>
          )}

          {!historyLoading && historyLoaded && !historyError && history.length > 0 && (
            <View>
              {history.map((item) => (
                <AttendanceHistoryCard key={item.id} item={item} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <PilulaVoltarAoTopo visivel={pilula.visivel} onPress={pilula.subir} />
    </View>
  );
}
