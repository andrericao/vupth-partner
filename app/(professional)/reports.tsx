import { useState, useEffect, useCallback } from "react";
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
import { router } from "expo-router";
import { Header } from "@components/Header";
import { ExpedienteCard } from "@components/ExpedienteCard";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { useProfessionalStore, type ProfessionalReport } from "@store/professional.store";
import { periodRange } from "@lib/time";
import { cardShadow } from "@lib/styles";

type Period = "day" | "week" | "month";

function humanizeService(value: string | null): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ProfessionalReportsScreen() {
  const [period, setPeriod] = useState<Period>("day");
  const professional = useProfessionalStore((s) => s.professional);
  const fetchMyReport = useProfessionalStore((s) => s.fetchMyReport);
  const { data } = useQueuePolling(professional?.establishment_id ?? null);

  const [report, setReport] = useState<ProfessionalReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const myProfessional = data?.professionals?.find((p) => p.id === professional?.id);
  const queueCount = myProfessional?.queue_count ?? 0;
  const waitMinutes = myProfessional?.estimated_wait_minutes ?? 0;

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const { dateFrom, dateTo } = periodRange(period);
      setReport(await fetchMyReport(dateFrom, dateTo));
    } catch {
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }, [period, fetchMyReport]);

  useEffect(() => {
    // fetch on-mount/periodo; sinaliza isLoading (padrao de carregamento).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReport();
  }, [loadReport]);

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
    >
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton onBack={() => router.navigate("/(professional)/queue" as any)} />

        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Relatorios
        </Heading>

        <HStack mt="$6" space="sm">
          {periods.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => setPeriod(p.key)}
              bg={period === p.key ? "$green500" : "$coolGray100"}
              py="$2"
              px="$4"
              borderRadius="$full"
              flex={1}
            >
              <Text
                fontFamily="$body"
                color={period === p.key ? "$white" : "$coolGray700"}
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
            <VStack flex={1} bg="$white" p="$4" borderRadius="$2xl" style={cardShadow}>
              <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
                Na fila agora
              </Text>
              <Text fontFamily="$heading" fontWeight="$bold" fontSize="$3xl" color="$green700">
                {queueCount}
              </Text>
            </VStack>
            <VStack flex={1} bg="$white" p="$4" borderRadius="$2xl" style={cardShadow}>
              <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
                Espera estimada
              </Text>
              <Text fontFamily="$heading" fontWeight="$bold" fontSize="$3xl" color="$blue600">
                {waitMinutes} min
              </Text>
            </VStack>
          </HStack>
        )}

        {isLoading ? (
          <VStack mt="$6">
            <SkeletonList count={2} />
          </VStack>
        ) : (
          <VStack space="md">
            <HStack space="md">
              <VStack flex={1} bg="$white" p="$4" borderRadius="$2xl" style={cardShadow}>
                <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
                  Atendimentos
                </Text>
                <Text fontFamily="$heading" fontWeight="$bold" fontSize="$3xl" color="$coolGray800">
                  {report?.totalAttendances ?? 0}
                </Text>
              </VStack>
              <VStack flex={1} bg="$green50" p="$4" borderRadius="$2xl" style={cardShadow}>
                <Text fontFamily="$body" fontSize="$sm" color="$green700">
                  Receita
                </Text>
                <Text fontFamily="$heading" fontWeight="$bold" fontSize="$2xl" color="$green800">
                  R$ {Number(report?.totalRevenue ?? 0).toFixed(2)}
                </Text>
              </VStack>
            </HStack>

            <HStack space="md">
              <VStack flex={1} bg="$white" p="$4" borderRadius="$2xl" style={cardShadow}>
                <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
                  Duracao media
                </Text>
                <Text fontFamily="$heading" fontWeight="$bold" fontSize="$xl" color="$coolGray800">
                  {Math.round(report?.avgDurationMinutes ?? 0)} min
                </Text>
              </VStack>
              <VStack flex={1} bg="$white" p="$4" borderRadius="$2xl" style={cardShadow}>
                <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
                  Servico mais feito
                </Text>
                <Text fontFamily="$heading" fontWeight="$bold" fontSize="$md" color="$coolGray800">
                  {humanizeService(report?.topService ?? null)}
                </Text>
              </VStack>
            </HStack>

            <Text fontFamily="$body" fontSize="$xs" color="$coolGray400" textAlign="center" mt="$2">
              {period === "day" ? "Hoje" : period === "week" ? "Ultimos 7 dias" : "Ultimos 30 dias"} •
              atendimentos finalizados
            </Text>
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
