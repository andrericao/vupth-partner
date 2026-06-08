import { useState, useCallback } from "react";

import {
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  BadgeText,
  ScrollView,
  Spinner,
  Pressable,
  Divider,
} from "@gluestack-ui/themed";
import { RefreshControl } from "react-native";
import { Header } from "@components/Header";
import { useAttendanceStore } from "@store/attendance.store";
import { useEstablishmentStore } from "@store/establishment.store";
import type { AttendanceHistoryItem } from "@lib/types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  FINISHED: { label: "Finalizado", color: "$green500" },
  CANCELLED: { label: "Cancelado", color: "$red500" },
  IN_PROGRESS: { label: "Em andamento", color: "$blue500" },
  PAUSED: { label: "Pausado", color: "$amber500" },
  SCHEDULED: { label: "Agendado", color: "$coolGray500" },
};

function AttendanceHistoryCard({ item }: { item: AttendanceHistoryItem }) {
  const statusInfo = STATUS_LABELS[item.status] ?? { label: item.status, color: "$coolGray500" };
  const date = new Date(item.scheduledTime);
  const dateStr = `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <VStack
      bg="$white"
      p="$4"
      borderRadius="$lg"
      borderWidth="$1"
      borderColor="$coolGray200"
      mb="$3"
    >
      <HStack justifyContent="space-between" alignItems="center">
        <VStack flex={1}>
          <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900">
            {item.clientName}
          </Text>
          <Text fontFamily="$body" fontSize="$xs" color="$coolGray500">
            Prof: {item.professionalName}
          </Text>
        </VStack>
        <Badge
          action={item.status === "FINISHED" ? "success" : item.status === "CANCELLED" ? "error" : "info"}
          variant="solid"
          borderRadius="$md"
        >
          <BadgeText fontSize="$xs">{statusInfo.label}</BadgeText>
        </Badge>
      </HStack>

      <Text fontFamily="$body" fontSize="$xs" color="$coolGray500" mt="$1">
        {dateStr}
        {item.durationInMinutes != null && ` — ${item.durationInMinutes}min`}
      </Text>

      <Text fontFamily="$body" fontSize="$sm" color="$coolGray600" mt="$1">
        {item.services.map((s) => s.customName).join(", ")}
      </Text>

      <HStack mt="$2" justifyContent="flex-end">
        <Text fontFamily="$heading" fontWeight="$bold" color="$green700">
          R$ {item.totalValue.toFixed(2)}
        </Text>
      </HStack>
    </VStack>
  );
}

type Filter = "ALL" | "FINISHED" | "CANCELLED";

export default function OwnerAttendancesScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const history = useAttendanceStore((s) => s.history);
  const fetchHistory = useAttendanceStore((s) => s.fetchHistory);

  const [filter, setFilter] = useState<Filter>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!establishment?.id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const params: Record<string, string> = { establishmentId: establishment.id };
      if (filter !== "ALL") params.status = filter;
      await fetchHistory(params);
      setLoaded(true);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [establishment?.id, filter, fetchHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  const filters: { key: Filter; label: string }[] = [
    { key: "ALL", label: "Todos" },
    { key: "FINISHED", label: "Finalizados" },
    { key: "CANCELLED", label: "Cancelados" },
  ];

  const totalRevenue = history
    .filter((a) => a.status === "FINISHED")
    .reduce((sum, a) => sum + a.totalValue, 0);

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton />

        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Atendimentos
        </Heading>
        <Text fontFamily="$body" color="$coolGray500" mt="$1">
          {establishment?.name}
        </Text>

        <HStack mt="$4" space="sm" mb="$4">
          {filters.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              bg={filter === f.key ? "$green500" : "$coolGray100"}
              py="$2"
              px="$4"
              borderRadius="$full"
              flex={1}
            >
              <Text
                fontFamily="$body"
                color={filter === f.key ? "$white" : "$coolGray700"}
                textAlign="center"
                fontSize="$sm"
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </HStack>

        {!loaded && !isLoading && (
          <Pressable
            onPress={loadHistory}
            bg="$green500"
            py="$3"
            px="$6"
            borderRadius="$md"
            alignSelf="center"
            mt="$6"
          >
            <Text fontFamily="$body" color="$white" textAlign="center">
              Carregar atendimentos
            </Text>
          </Pressable>
        )}

        {isLoading && (
          <VStack alignItems="center" mt="$12">
            <Spinner color="$green500" size="large" />
            <Text fontFamily="$body" color="$coolGray500" mt="$4">Carregando...</Text>
          </VStack>
        )}

        {hasError && (
          <VStack bg="$amber50" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$amber200" mt="$4">
            <Text fontFamily="$body" color="$amber700" textAlign="center">
              Endpoint de historico ainda nao disponivel no backend.
            </Text>
            <Text fontFamily="$body" color="$amber600" fontSize="$xs" textAlign="center" mt="$1">
              GET /attendances — aguardando implementacao
            </Text>
          </VStack>
        )}

        {loaded && !hasError && history.length > 0 && (
          <VStack bg="$green50" p="$3" borderRadius="$lg" borderWidth="$1" borderColor="$green200" mb="$4">
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontFamily="$body" fontSize="$sm" color="$green700">
                {history.length} atendimento{history.length !== 1 ? "s" : ""}
              </Text>
              <Text fontFamily="$heading" fontWeight="$bold" color="$green800">
                R$ {totalRevenue.toFixed(2)}
              </Text>
            </HStack>
          </VStack>
        )}

        {loaded && !hasError && history.length === 0 && (
          <Text fontFamily="$body" color="$coolGray400" textAlign="center" mt="$12">
            Nenhum atendimento encontrado
          </Text>
        )}

        {loaded && !hasError && history.length > 0 && (
          <VStack>
            <Divider mb="$4" />
            {history.map((item) => (
              <AttendanceHistoryCard key={item.id} item={item} />
            ))}
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
