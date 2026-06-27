import { useState, useCallback, useEffect } from "react";
import {
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  BadgeText,
  ScrollView,
  Pressable,
  Divider,
} from "@gluestack-ui/themed";
import { SkeletonList } from "@components/Skeleton";
import { Alert, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { useAttendanceStore } from "@store/attendance.store";
import { cardShadow } from "@lib/styles";
import { useProfessionalStore } from "@store/professional.store";
import type { AttendanceHistoryItem } from "@lib/types";
import { getApiErrorMessage } from "@lib/api";

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
      borderRadius="$2xl"
      style={cardShadow}
      mb="$3"
    >
      <HStack justifyContent="space-between" alignItems="center">
        <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900">
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

export default function ProfessionalAttendancesScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  const history = useAttendanceStore((s) => s.history);
  const fetchHistory = useAttendanceStore((s) => s.fetchHistory);

  const [filter, setFilter] = useState<Filter>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!professional?.id) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const params: Record<string, string> = { professionalId: professional.id };
      if (filter !== "ALL") params.status = filter;
      await fetchHistory(params);
      setLoaded(true);
    } catch (error: any) {
      const msg = getApiErrorMessage(error, "Nao foi possivel carregar os atendimentos.");
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  }, [professional?.id, filter, fetchHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton onBack={() => router.navigate("/(professional)/profile" as any)} />

        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Meus Atendimentos
        </Heading>

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

        {isLoading && (
          <VStack mt="$6">
            <SkeletonList count={3} />
          </VStack>
        )}

        {errorMsg && (
          <VStack bg="$amber50" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$amber200" mt="$4">
            <Text fontFamily="$body" color="$amber700" textAlign="center">
              {errorMsg}
            </Text>
            <Pressable onPress={loadHistory} mt="$2">
              <Text fontFamily="$body" color="$green600" textAlign="center" fontSize="$sm">
                Tentar novamente
              </Text>
            </Pressable>
          </VStack>
        )}

        {loaded && !errorMsg && history.length === 0 && (
          <Text fontFamily="$body" color="$coolGray400" textAlign="center" mt="$12">
            Nenhum atendimento encontrado
          </Text>
        )}

        {loaded && !errorMsg && history.length > 0 && (
          <VStack mt="$2">
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
