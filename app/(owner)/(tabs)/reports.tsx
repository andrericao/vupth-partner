import { useState, useCallback, useEffect } from "react";
import {
  VStack,
  HStack,
  Text,
  Pressable,
  ScrollView,
  Divider,
} from "@gluestack-ui/themed";
import { SkeletonList } from "@components/Skeleton";
import { RefreshControl } from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { useEstablishmentStore, type EstablishmentReport } from "@store/establishment.store";
import { getApiErrorMessage } from "@lib/api";
import { ExpedienteCard } from "@components/ExpedienteCard";
import { periodRange } from "@lib/time";
import { StatCard } from "@components/brand/StatCard";

type Period = "day" | "week" | "month";

export default function OwnerReportsScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const fetchReport = useEstablishmentStore((s) => s.fetchReport);
  const { data: queue, refetch } = useQueuePolling(establishment?.id ?? null);

  const [period, setPeriod] = useState<Period>("day");
  const [report, setReport] = useState<EstablishmentReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const loadReport = useCallback(async () => {
    if (!establishment?.id) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { dateFrom, dateTo } = periodRange(period);
      setReport(await fetchReport(establishment.id, dateFrom, dateTo));
    } catch (error: any) {
      setErrorMsg(getApiErrorMessage(error, "Não foi possível carregar o relatório."));
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }, [establishment?.id, period, fetchReport]);

  useEffect(() => {
    // fetch on-mount/periodo; sinaliza isLoading (padrao de carregamento).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReport();
  }, [loadReport]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadReport(), refetch()]);
    setRefreshing(false);
  }, [loadReport, refetch]);

  const totalInQueue = queue?.total_in_queue ?? 0;
  const availableProfs = queue?.available_professionals ?? 0;

  // Breakdown do relatorio por profissional, indexado por id.
  const revById = (report?.professionals ?? []).reduce<Record<string, { revenue: number; attendances: number }>>(
    (acc, p) => {
      acc[p.id] = { revenue: p.revenue, attendances: p.attendances };
      return acc;
    },
    {}
  );
  const liveProfs = queue?.professionals ?? [];

  const periods: { key: Period; label: string }[] = [
    { key: "day", label: "Hoje" },
    { key: "week", label: "Semana" },
    { key: "month", label: "Mês" },
  ];

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <VStack flex={1} pb="$12" px="$4">
        <ScreenHeader
          title="Relatórios"
          subtitle={establishment?.name ?? undefined}
          onBack={() => router.navigate("/(owner)/menu" as any)}
        />

        <Text fontFamily="$heading" fontWeight="$bold" color="$brandTextSecondary" mt="$6" mb="$2">
          Agora
        </Text>
        <HStack space="md">
          {/* "Na fila" so vira heroi quando HA fila: zero e a ausencia de
              fila, não o número que importa (mesma regra do dashboard). */}
          <StatCard flex={1} label="Na fila" value={String(totalInQueue)} hero={totalInQueue > 0} />
          <StatCard flex={1} label="Profissionais disponíveis" value={String(availableProfs)} />
        </HStack>

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

        {errorMsg && (
          <VStack bg="$brandSurface" p="$4" borderRadius="$card" mt="$4">
            <Text fontFamily="$body" color="$brandDanger" textAlign="center">
              {errorMsg}
            </Text>
          </VStack>
        )}

        {isLoading ? (
          <VStack mt="$6">
            <SkeletonList count={2} />
          </VStack>
        ) : (
          <>
            {/* Receita e o heroi da secao do periodo — o unico numero em
                dinheiro, e o que o dono abre o relatório pra ver. Vem PRIMEIRO
                pelo mesmo motivo (mesma ordem do relatório do profissional). */}
            <HStack space="md" mt="$4">
              <StatCard
                flex={1}
                label="Receita"
                value={`R$ ${Number(report?.totalRevenue ?? 0).toFixed(2)}`}
                hero
              />
              <StatCard flex={1} label="Atendimentos" value={String(report?.totalAttendances ?? 0)} />
            </HStack>

            <HStack space="md" mt="$3">
              <StatCard
                flex={1}
                label="Duração média"
                value={`${Math.round(report?.avgDurationMinutes ?? 0)} min`}
              />
              <VStack flex={1} bg="$brandSurface" p="$4" borderRadius="$card">
                <Text fontFamily="$display" fontSize={16} color="$forest">
                  {report?.topProfessional ?? "—"}
                </Text>
                <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary" mt="$1">
                  destaque
                </Text>
              </VStack>
            </HStack>

            <Divider my="$6" />

            <Text fontFamily="$heading" fontWeight="$bold" color="$brandTextSecondary" mb="$3">
              Por profissional
            </Text>

            {liveProfs.length === 0 ? (
              <Text fontFamily="$body" color="$brandTextSecondary" textAlign="center" mt="$4">
                Nenhum profissional vinculado
              </Text>
            ) : (
              <VStack space="sm">
                {liveProfs.map((p) => {
                  const r = revById[p.id] ?? { revenue: 0, attendances: 0 };
                  return (
                    <VStack key={p.id} bg="$brandSurface" p="$4" borderRadius="$card">
                      <HStack justifyContent="space-between" alignItems="center">
                        <VStack flex={1}>
                          <Text fontFamily="$heading" fontWeight="$bold" color="$forest">
                            {p.name}
                          </Text>
                          <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary">
                            {p.specialty || "Sem especialidade"}
                          </Text>
                        </VStack>
                        <Text fontFamily="$heading" fontWeight="$bold" color="$forest">
                          R$ {r.revenue.toFixed(2)}
                        </Text>
                      </HStack>

                      <HStack mt="$3" space="md">
                        <VStack flex={1}>
                          <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary">Na fila</Text>
                          <Text fontFamily="$heading" fontWeight="$bold" color="$brandTextSecondary">{p.queue_count}</Text>
                        </VStack>
                        <VStack flex={1}>
                          <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary">Espera</Text>
                          <Text fontFamily="$heading" fontWeight="$bold" color="$brandTextSecondary">{p.estimated_wait_minutes} min</Text>
                        </VStack>
                        <VStack flex={1}>
                          <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary">Finalizados</Text>
                          <Text fontFamily="$heading" fontWeight="$bold" color="$brandTextSecondary">{r.attendances}</Text>
                        </VStack>
                      </HStack>
                    </VStack>
                  );
                })}
              </VStack>
            )}
          </>
        )}
      </VStack>
    </ScrollView>
  );
}
