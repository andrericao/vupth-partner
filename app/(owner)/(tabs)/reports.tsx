import { useState, useCallback, useEffect } from "react";
import {
  VStack,
  HStack,
  Heading,
  Text,
  Pressable,
  ScrollView,
  Divider,
} from "@gluestack-ui/themed";
import { SkeletonList } from "@components/Skeleton";
import { RefreshControl } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { useEstablishmentStore, type EstablishmentReport } from "@store/establishment.store";
import { getApiErrorMessage } from "@lib/api";
import { ExpedienteCard } from "@components/ExpedienteCard";
import { periodRange } from "@lib/time";

type Period = "day" | "week" | "month";

// [marca-vupth] Era `color`/`bg`/`border` cru por chamada (e `border` nem
// chegava a ser usado) — foi assim que um `$blue50`/`$blue800`, cor que nao
// existe na marca, entrou na tela. Agora so existe UMA decisao: este card e o
// heroi da secao ou nao. Heroi = brand-green (o Pencil usa 1-2 por tela);
// resto = surface, PLANO. Sem sombra: no Pencil inteiro so 13 elementos tem
// sombra (tab bars, FAB, notificacao — coisas que flutuam de verdade); card
// sobre surface e sempre plano, e sombra em tudo faz tudo parecer clicavel.
function StatCard({
  label,
  value,
  hero = false,
}: {
  label: string;
  value: string;
  hero?: boolean;
}) {
  return (
    <VStack flex={1} bg={hero ? "$brandGreen" : "$brandSurface"} p="$4" borderRadius="$card">
      <Text fontFamily="$display" fontSize={26} color="$forest">
        {value}
      </Text>
      <Text
        fontFamily="$body"
        fontSize="$xs"
        color={hero ? "$forest" : "$coolGray500"}
        mt="$1"
      >
        {label}
      </Text>
    </VStack>
  );
}

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
      setErrorMsg(getApiErrorMessage(error, "Nao foi possivel carregar o relatorio."));
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
    { key: "month", label: "Mes" },
  ];

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton onBack={() => router.navigate("/(owner)/menu" as any)} />

        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Relatorios
        </Heading>
        <Text fontFamily="$body" color="$coolGray500" mt="$1">
          {establishment?.name ?? ""}
        </Text>

        <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray700" mt="$6" mb="$2">
          Agora
        </Text>
        <HStack space="md">
          {/* "Na fila" so vira heroi quando HA fila: zero e a ausencia de
              fila, nao o numero que importa (mesma regra do dashboard). */}
          <StatCard label="Na fila" value={String(totalInQueue)} hero={totalInQueue > 0} />
          <StatCard label="Profissionais disponíveis" value={String(availableProfs)} />
        </HStack>

        <HStack mt="$6" space="sm">
          {periods.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => setPeriod(p.key)}
              bg={period === p.key ? "$forest" : "$coolGray100"}
              py="$2"
              px="$4"
              borderRadius="$full"
              flex={1}
            >
              <Text
                fontFamily="$body"
                color={period === p.key ? "$brandGreen" : "$coolGray700"}
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
                dinheiro, e o que o dono abre o relatorio pra ver. Vem PRIMEIRO
                pelo mesmo motivo (mesma ordem do relatorio do profissional). */}
            <HStack space="md" mt="$4">
              <StatCard
                label="Receita"
                value={`R$ ${Number(report?.totalRevenue ?? 0).toFixed(2)}`}
                hero
              />
              <StatCard label="Atendimentos" value={String(report?.totalAttendances ?? 0)} />
            </HStack>

            <HStack space="md" mt="$3">
              <StatCard
                label="Duração média"
                value={`${Math.round(report?.avgDurationMinutes ?? 0)} min`}
              />
              <VStack flex={1} bg="$brandSurface" p="$4" borderRadius="$card">
                <Text fontFamily="$display" fontSize={16} color="$forest">
                  {report?.topProfessional ?? "—"}
                </Text>
                <Text fontFamily="$body" fontSize="$xs" color="$coolGray500" mt="$1">
                  destaque
                </Text>
              </VStack>
            </HStack>

            <Divider my="$6" />

            <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray700" mb="$3">
              Por profissional
            </Text>

            {liveProfs.length === 0 ? (
              <Text fontFamily="$body" color="$coolGray400" textAlign="center" mt="$4">
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
                          <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900">
                            {p.name}
                          </Text>
                          <Text fontFamily="$body" fontSize="$xs" color="$coolGray500">
                            {p.specialty || "Sem especialidade"}
                          </Text>
                        </VStack>
                        <Text fontFamily="$heading" fontWeight="$bold" color="$forest">
                          R$ {r.revenue.toFixed(2)}
                        </Text>
                      </HStack>

                      <HStack mt="$3" space="md">
                        <VStack flex={1}>
                          <Text fontFamily="$body" fontSize="$xs" color="$coolGray400">Na fila</Text>
                          <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray700">{p.queue_count}</Text>
                        </VStack>
                        <VStack flex={1}>
                          <Text fontFamily="$body" fontSize="$xs" color="$coolGray400">Espera</Text>
                          <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray700">{p.estimated_wait_minutes} min</Text>
                        </VStack>
                        <VStack flex={1}>
                          <Text fontFamily="$body" fontSize="$xs" color="$coolGray400">Finalizados</Text>
                          <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray700">{r.attendances}</Text>
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
