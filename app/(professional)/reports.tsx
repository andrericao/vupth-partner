import { useState } from "react";
import {
  VStack,
  HStack,
  Heading,
  Text,
  Pressable,
  ScrollView,
  Divider,
} from "@gluestack-ui/themed";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { useProfessionalStore } from "@store/professional.store";

type Period = "day" | "week" | "month";

export default function ProfessionalReportsScreen() {
  const [period, setPeriod] = useState<Period>("day");
  const professional = useProfessionalStore((s) => s.professional);
  const { data } = useQueuePolling(professional?.establishment_id ?? null);

  const myProfessional = data?.professionals?.find(
    (p) => p.id === professional?.id
  );

  const queueCount = myProfessional?.queue_count ?? 0;
  const waitMinutes = myProfessional?.estimated_wait_minutes ?? 0;

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
        <Header showBackButton onBack={() => router.navigate("/(professional)/profile" as any)} />

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

        <Divider my="$6" />

        {period === "day" && (
          <VStack space="md">
            <VStack bg="$white" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200">
              <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
                Clientes na fila agora
              </Text>
              <Text fontFamily="$heading" fontWeight="$bold" fontSize="$3xl" color="$green700">
                {queueCount}
              </Text>
            </VStack>

            <VStack bg="$white" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200">
              <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
                Tempo estimado de espera
              </Text>
              <Text fontFamily="$heading" fontWeight="$bold" fontSize="$3xl" color="$blue600">
                {waitMinutes} min
              </Text>
            </VStack>

            <VStack bg="$coolGray50" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200">
              <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
                Atendimentos finalizados / Receita
              </Text>
              <Text fontFamily="$body" color="$coolGray400" mt="$2">
                Em breve — aguardando endpoint de historico
              </Text>
            </VStack>
          </VStack>
        )}

        {period !== "day" && (
          <VStack bg="$coolGray50" p="$6" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200" alignItems="center">
            <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray500">
              Em breve
            </Text>
            <Text fontFamily="$body" color="$coolGray400" mt="$2" textAlign="center">
              Relatorios semanais e mensais necessitam de endpoint de historico no backend
            </Text>
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
