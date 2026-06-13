import { useState, useCallback, useEffect } from "react";
import {
  VStack,
  HStack,
  Heading,
  Text,
  ScrollView,
  Spinner,
  Divider,
} from "@gluestack-ui/themed";
import { RefreshControl } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { useEstablishmentStore } from "@store/establishment.store";
import { useAttendanceStore } from "@store/attendance.store";
import { getApiErrorMessage } from "@lib/api";

type ProfStats = {
  id: string;
  name: string;
  specialty: string;
  queueCount: number;
  waitMinutes: number;
  isAvailable: boolean;
  finishedCount: number;
  revenue: number;
};

function StatCard({
  label,
  value,
  color,
  bg,
  border,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <VStack flex={1} bg={bg} p="$3" borderRadius="$lg" borderWidth="$1" borderColor={border}>
      <Text fontFamily="$body" fontSize="$xs" color={color}>
        {label}
      </Text>
      <Text fontFamily="$heading" fontWeight="$bold" fontSize="$2xl" color={color}>
        {value}
      </Text>
    </VStack>
  );
}

export default function OwnerReportsScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const { data: queue, refetch } = useQueuePolling(establishment?.id ?? null);
  const history = useAttendanceStore((s) => s.history);
  const fetchHistory = useAttendanceStore((s) => s.fetchHistory);

  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!establishment?.id) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await fetchHistory({ establishmentId: establishment.id, status: "FINISHED" });
      setLoaded(true);
    } catch (error: any) {
      setErrorMsg(getApiErrorMessage(error, "Nao foi possivel carregar o relatorio."));
    } finally {
      setIsLoading(false);
    }
  }, [establishment?.id, fetchHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadHistory(), refetch()]);
    setRefreshing(false);
  }, [loadHistory, refetch]);

  // history e estado global compartilhado com a tela de Atendimentos;
  // filtramos FINISHED para nao contar cancelados caso haja dado residual
  const finished = history.filter((a) => a.status === "FINISHED");

  // Agrega o historico finalizado por profissional
  const historyByProf = finished.reduce<Record<string, { count: number; revenue: number }>>(
    (acc, a) => {
      const cur = acc[a.professionalId] ?? { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += a.totalValue;
      acc[a.professionalId] = cur;
      return acc;
    },
    {}
  );

  // Unifica os profissionais do estabelecimento (fila ao vivo + historico)
  const professionals = queue?.professionals ?? [];
  const stats: ProfStats[] = professionals.map((p) => ({
    id: p.id,
    name: p.name,
    specialty: p.specialty ?? "",
    queueCount: p.queue_count,
    waitMinutes: p.estimated_wait_minutes,
    isAvailable: p.is_available,
    finishedCount: historyByProf[p.id]?.count ?? 0,
    revenue: historyByProf[p.id]?.revenue ?? 0,
  }));

  const totalFinished = finished.length;
  const totalRevenue = finished.reduce((sum, a) => sum + a.totalValue, 0);
  const totalInQueue = queue?.total_in_queue ?? 0;
  const availableProfs = queue?.available_professionals ?? 0;

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
          <StatCard label="Na fila" value={String(totalInQueue)} color="$green800" bg="$green50" border="$green200" />
          <StatCard label="Profissionais disponiveis" value={String(availableProfs)} color="$blue800" bg="$blue50" border="$blue200" />
        </HStack>

        <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray700" mt="$6" mb="$2">
          Atendimentos finalizados
        </Text>
        <HStack space="md">
          <StatCard label="Total" value={String(totalFinished)} color="$coolGray800" bg="$coolGray50" border="$coolGray200" />
          <StatCard label="Receita" value={`R$ ${totalRevenue.toFixed(2)}`} color="$green800" bg="$green50" border="$green200" />
        </HStack>

        {isLoading && !loaded && (
          <VStack alignItems="center" mt="$8">
            <Spinner color="$green500" size="large" />
          </VStack>
        )}

        {errorMsg && (
          <VStack bg="$amber50" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$amber200" mt="$4">
            <Text fontFamily="$body" color="$amber700" textAlign="center">
              {errorMsg}
            </Text>
          </VStack>
        )}

        <Divider my="$6" />

        <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray700" mb="$3">
          Por profissional
        </Text>

        {stats.length === 0 ? (
          <Text fontFamily="$body" color="$coolGray400" textAlign="center" mt="$4">
            Nenhum profissional vinculado
          </Text>
        ) : (
          <VStack space="sm">
            {stats.map((p) => (
              <VStack
                key={p.id}
                bg="$white"
                p="$4"
                borderRadius="$lg"
                borderWidth="$1"
                borderColor="$coolGray200"
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <VStack flex={1}>
                    <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900">
                      {p.name}
                    </Text>
                    <Text fontFamily="$body" fontSize="$xs" color="$coolGray500">
                      {p.specialty || "Sem especialidade"}
                    </Text>
                  </VStack>
                  <Text fontFamily="$heading" fontWeight="$bold" color="$green700">
                    R$ {p.revenue.toFixed(2)}
                  </Text>
                </HStack>

                <HStack mt="$3" space="md">
                  <VStack flex={1}>
                    <Text fontFamily="$body" fontSize="$xs" color="$coolGray400">Na fila</Text>
                    <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray700">{p.queueCount}</Text>
                  </VStack>
                  <VStack flex={1}>
                    <Text fontFamily="$body" fontSize="$xs" color="$coolGray400">Espera</Text>
                    <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray700">{p.waitMinutes} min</Text>
                  </VStack>
                  <VStack flex={1}>
                    <Text fontFamily="$body" fontSize="$xs" color="$coolGray400">Finalizados</Text>
                    <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray700">{p.finishedCount}</Text>
                  </VStack>
                </HStack>
              </VStack>
            ))}
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
