import { useState, useCallback, useEffect } from "react";
import { useVoltarAoTopo } from "@hooks/useVoltarAoTopo";
import { useIsFocused } from "@react-navigation/native";
import {
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  BadgeText,
  Pressable,
  ScrollView,
  Divider,
} from "@gluestack-ui/themed";
import { RefreshControl } from "react-native";
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

// "MEU DIA" (2026-07-22) — unifica as antigas telas Relatorios + Atendimentos,
// como no mockup do menu ("atendidos, faturado, historico" num item so).
// - O seletor de PERIODO (Hoje/Semana/Mes) governa o RESUMO (GET
//   /professional/me/reports?dateFrom&dateTo).
// - O HISTORICO usa os proprios filtros de STATUS: o GET /attendances nao
//   aceita datas (so professionalId/status), entao nao fingimos um filtro de
//   periodo que o backend nao faz.
type Period = "day" | "week" | "month";
type Filter = "ALL" | "FINISHED" | "CANCELLED";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  FINISHED: { label: "Finalizado", color: "$forest" },
  CANCELLED: { label: "Cancelado", color: "$brandDanger" },
  IN_PROGRESS: { label: "Em andamento", color: "$forest" },
  PAUSED: { label: "Pausado", color: "$brandWarning" },
  SCHEDULED: { label: "Agendado", color: "$brandTextSecondary" },
};

function humanizeService(value: string | null): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function AttendanceHistoryCard({ item }: { item: AttendanceHistoryItem }) {
  const statusInfo = STATUS_LABELS[item.status] ?? { label: item.status, color: "$brandTextSecondary" };
  const date = new Date(item.scheduledTime);
  const dateStr = `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <VStack bg="$brandSurface" p="$4" borderRadius="$card" mb="$3">
      <HStack justifyContent="space-between" alignItems="center">
        <Text fontFamily="$heading" fontWeight="$bold" color="$forest">
          {item.clientName}
        </Text>
        <Badge
          action={item.status === "FINISHED" ? "success" : item.status === "CANCELLED" ? "error" : "info"}
          variant="solid"
          borderRadius="$md"
        >
          <BadgeText fontSize="$xs">{statusInfo.label}</BadgeText>
        </Badge>
      </HStack>

      <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary" mt="$1">
        {dateStr}
        {item.durationInMinutes != null && ` — ${item.durationInMinutes}min`}
      </Text>

      <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary" mt="$1">
        {item.services.map((s) => s.customName).join(", ")}
      </Text>

      <HStack mt="$2" justifyContent="flex-end">
        <Text fontFamily="$heading" fontWeight="$bold" color="$forest">
          R$ {item.totalValue.toFixed(2)}
        </Text>
      </HStack>
    </VStack>
  );
}

export default function MyDayScreen() {
  // Tocar na aba JA ATIVA volta ao topo (Andre, 18/09).
  const rolagemRef = useVoltarAoTopo();

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
  ];

  return (
    <ScrollView
        ref={rolagemRef}
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <VStack flex={1} pb="$12" px="$4">
        {/* [marca-vupth] Titulo do Pencil (PROF · 03) e "Seu dia" — bate com o
            conceito interno da tela ("MEU DIA", que uniu Relatórios +
            Atendimentos); "Relatórios" ficou só no rotulo da aba, mais curto
            pra caber no rodape. */}
        <ScreenHeader
          title="Seu dia"
          onBack={() => router.navigate("/(professional)/queue" as any)}
        />

        <HStack mt="$6" space="sm">
          {periods.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => setPeriod(p.key)}
              bg={period === p.key ? "$forest" : "$brandSurface"}
              py="$2"
              px="$4"
              borderRadius="$full"
              flexShrink={0}
            >
              <Text
                numberOfLines={1}
                fontFamily="$body"
                color={period === p.key ? "$brandGreen" : "$brandTextSecondary"}
                textAlign="center"
                fontSize="$sm"
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </HStack>

        <ExpedienteCard />

        <Divider my="$6" />

        {period === "day" && (
          <HStack space="md" mb="$4">
            <VStack flex={1} bg="$brandSurface" p="$4" borderRadius="$card">
              <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary">
                Na fila agora
              </Text>
              <Text fontFamily="$heading" fontWeight="$bold" fontSize="$3xl" color="$forest">
                {queueCount}
              </Text>
            </VStack>
            <VStack flex={1} bg="$brandSurface" p="$4" borderRadius="$card">
              <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary">
                Espera estimada
              </Text>
              <Text fontFamily="$heading" fontWeight="$bold" fontSize="$3xl" color="$forest">
                {waitMinutes} min
              </Text>
            </VStack>
          </HStack>
        )}

        {reportLoading ? (
          <VStack mt="$2">
            <SkeletonList count={2} />
          </VStack>
        ) : (
          <VStack space="md">
            {/* [marca-vupth] Receita virou o card-heroi (brandGreen, primeira
                posição) — o Pencil (PROF · 03) da esse tratamento pro
                faturado, o único número em dinheiro da tela. Era greenTint
                (tom fraco) na segunda posição, com o valor MENOR que o dos
                outros cards (2xl vs 3xl) — inconsistente pro card que deveria
                pesar mais, não menos. */}
            <HStack space="md">
              <VStack flex={1} bg="$brandGreen" p="$4" borderRadius="$card">
                <Text fontFamily="$body" fontSize="$sm" color="$forest">
                  Receita
                </Text>
                <Text fontFamily="$heading" fontWeight="$bold" fontSize="$3xl" color="$forest">
                  R$ {Number(report?.totalRevenue ?? 0).toFixed(2)}
                </Text>
              </VStack>
              <VStack flex={1} bg="$brandSurface" p="$4" borderRadius="$card">
                <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary">
                  Atendimentos
                </Text>
                <Text fontFamily="$heading" fontWeight="$bold" fontSize="$3xl" color="$forest">
                  {report?.totalAttendances ?? 0}
                </Text>
              </VStack>
            </HStack>

            <HStack space="md">
              <VStack flex={1} bg="$brandSurface" p="$4" borderRadius="$card">
                <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary">
                  Duracao media
                </Text>
                <Text fontFamily="$heading" fontWeight="$bold" fontSize="$xl" color="$forest">
                  {Math.round(report?.avgDurationMinutes ?? 0)} min
                </Text>
              </VStack>
              <VStack flex={1} bg="$brandSurface" p="$4" borderRadius="$card">
                <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary">
                  Serviço mais feito
                </Text>
                <Text fontFamily="$heading" fontWeight="$bold" fontSize="$md" color="$forest">
                  {humanizeService(report?.topService ?? null)}
                </Text>
              </VStack>
            </HStack>

            <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary" textAlign="center" mt="$2">
              {period === "day" ? "Hoje" : period === "week" ? "Ultimos 7 dias" : "Ultimos 30 dias"} •
              atendimentos finalizados
            </Text>
          </VStack>
        )}

        <Divider my="$6" />

        <Heading size="lg" fontFamily="$heading" mb="$3">
          Historico
        </Heading>

        <HStack space="sm" mb="$4">
          {filters.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              bg={filter === f.key ? "$forest" : "$brandSurface"}
              py="$2"
              px="$4"
              borderRadius="$full"
              flexShrink={0}
            >
              <Text
                numberOfLines={1}
                fontFamily="$body"
                color={filter === f.key ? "$brandGreen" : "$brandTextSecondary"}
                textAlign="center"
                fontSize="$sm"
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </HStack>

        {historyLoading && (
          <VStack mt="$2">
            <SkeletonList count={3} />
          </VStack>
        )}

        {historyError && (
          <VStack bg="$brandWarning" p="$4" borderRadius="$card" mt="$2">
            <Text fontFamily="$body" color="$forest" textAlign="center">
              {historyError}
            </Text>
            <Pressable onPress={loadHistory} mt="$2">
              <Text fontFamily="$body" color="$forest" textAlign="center" fontSize="$sm">
                Tentar novamente
              </Text>
            </Pressable>
          </VStack>
        )}

        {!historyLoading && historyLoaded && !historyError && history.length === 0 && (
          <Text fontFamily="$body" color="$brandTextSecondary" textAlign="center" mt="$6">
            Nenhum atendimento encontrado
          </Text>
        )}

        {!historyLoading && historyLoaded && !historyError && history.length > 0 && (
          <VStack>
            {history.map((item) => (
              <AttendanceHistoryCard key={item.id} item={item} />
            ))}
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
