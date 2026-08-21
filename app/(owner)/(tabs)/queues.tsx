import { useState, useCallback } from "react";
import {
  VStack,
  HStack,
  Text,
  Badge,
  BadgeText,
  ScrollView,
  Pressable,
} from "@gluestack-ui/themed";
import { SkeletonList } from "@components/Skeleton";
import { RefreshControl } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { BrandButton } from "@components/brand/Button";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { useEstablishmentStore } from "@store/establishment.store";
import { ratingLabel } from "@lib/rating";
import type { ProfessionalWithQueue, AttendanceInQueue } from "@lib/types";

function AttendanceItem({ attendance }: { attendance: AttendanceInQueue }) {
  const statusLabel =
    attendance.status === "IN_PROGRESS"
      ? "Atendendo"
      : attendance.status === "PAUSED"
        ? "Pausado"
        : "Aguardando";
  const statusColor =
    attendance.status === "IN_PROGRESS"
      ? "$forest"
      : attendance.status === "PAUSED"
        ? "$amber500"
        : "$blue500";

  return (
    <HStack
      py="$2"
      px="$3"
      justifyContent="space-between"
      alignItems="center"
      borderBottomWidth="$1"
      borderBottomColor="$coolGray100"
    >
      <VStack flex={1}>
        <Text fontFamily="$body" fontSize="$sm" color="$coolGray900">
          {attendance.clientName}
        </Text>
        <Text fontFamily="$body" fontSize="$xs" color="$coolGray500">
          {attendance.services.map((s) => s.customName).join(", ")}
        </Text>
      </VStack>
      <VStack alignItems="flex-end">
        <Text fontFamily="$body" fontSize="$xs" color={statusColor}>
          {statusLabel}
        </Text>
        <Text fontFamily="$body" fontSize="$xs" color="$coolGray500">
          R$ {attendance.totalValue.toFixed(2)}
        </Text>
      </VStack>
    </HStack>
  );
}

function ProfessionalCard({ professional, establishmentId }: { professional: ProfessionalWithQueue; establishmentId: string }) {
  const [expanded, setExpanded] = useState(false);
  const allAttendances = [
    ...(professional.current_attendance ? [professional.current_attendance] : []),
    ...professional.waiting_list,
  ];

  return (
    <VStack bg="$brandSurface" borderRadius="$card"
      mb="$3" overflow="hidden">
      <Pressable onPress={() => setExpanded(!expanded)} py="$3" px="$4">
        <HStack justifyContent="space-between" alignItems="center">
          <VStack flex={1}>
            <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900">
              {professional.name}
            </Text>
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
              {professional.specialty ?? ""}
            </Text>
            {ratingLabel(professional.rating_average, professional.rating_count) && (
              <Text fontFamily="$body" fontSize="$xs" color="$amber600" mt="$0.5">
                ★ {ratingLabel(professional.rating_average, professional.rating_count)}
              </Text>
            )}
          </VStack>
          <VStack alignItems="flex-end">
            <Badge
              action={professional.queue_count > 0 ? "success" : "muted"}
              variant="solid"
              borderRadius="$md"
            >
              <BadgeText fontSize="$xs">{professional.queue_count} na fila</BadgeText>
            </Badge>
            <Text fontFamily="$body" fontSize="$xs" color="$coolGray500" mt="$1">
              {professional.estimated_wait_minutes} min
            </Text>
          </VStack>
        </HStack>
      </Pressable>

      {expanded && (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(owner)/professional-queue",
              params: {
                professionalId: professional.id,
                establishmentId,
                professionalName: professional.name,
              },
            } as any)
          }
          py="$2"
          px="$4"
          bg="$greenTint"
          borderTopWidth="$1"
          borderTopColor="$coolGray100"
        >
          <Text fontFamily="$body" fontSize="$sm" color="$forest" textAlign="center">
            Ver fila detalhada
          </Text>
        </Pressable>
      )}

      {expanded && allAttendances.length > 0 && (
        <VStack borderTopWidth="$1" borderTopColor="$coolGray100">
          {allAttendances.map((att) => (
            <AttendanceItem key={att.id} attendance={att} />
          ))}
        </VStack>
      )}

      {expanded && allAttendances.length === 0 && (
        <VStack py="$3" px="$4" borderTopWidth="$1" borderTopColor="$coolGray100">
          <Text fontFamily="$body" fontSize="$sm" color="$coolGray400" textAlign="center">
            Nenhum cliente na fila
          </Text>
        </VStack>
      )}
    </VStack>
  );
}

export default function OwnerQueuesScreen() {
  // Filas virou ABA — e aba nao recebe parametro de rota. O `establishmentId`
  // do param so existe quando a tela e aberta empilhada (ex.: pelo card do
  // dashboard); no acesso pela aba ele vem VAZIO, e sem o fallback pro store a
  // tela ficava sem fila nenhuma pra mostrar.
  const params = useLocalSearchParams<{ establishmentId?: string }>();
  const storeEstablishment = useEstablishmentStore((s) => s.establishment);
  const establishmentId = params.establishmentId || storeEstablishment?.id;

  const { data, isLoading, refetch } = useQueuePolling(establishmentId ?? null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const professionals = data?.professionals ?? [];

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <VStack flex={1} pt="$12" pb="$8" px="$5">
        {/* Sem botao de voltar: virou raiz de aba. O subtitulo carrega o total
            que antes ocupava dois cartoes de numero — o dono ja ve a contagem
            por profissional logo abaixo, entao repetir o agregado em destaque
            so empurrava a lista pra baixo. */}
        <Text fontFamily="$display" fontSize={26} letterSpacing={-0.8} color="$forest">
          Filas
        </Text>
        <Text fontFamily="$body" fontSize="$sm" color="$coolGray500" mt="$0.5" mb="$5">
          {data
            ? data.total_in_queue === 0
              ? "Ninguém esperando agora"
              : `${data.total_in_queue} ${data.total_in_queue === 1 ? "pessoa esperando" : "pessoas esperando"} agora`
            : "Carregando..."}
        </Text>

        {isLoading && !data && (
          <VStack mt="$6">
            <SkeletonList count={3} />
          </VStack>
        )}

        {professionals.map((prof) => (
          <ProfessionalCard key={prof.id} professional={prof} establishmentId={establishmentId ?? ""} />
        ))}

        {!isLoading && professionals.length === 0 && (
          <VStack alignItems="center" mt="$12">
            <Text fontFamily="$body" color="$coolGray400" textAlign="center">
              Nenhum profissional cadastrado
            </Text>
            <BrandButton
              title="Adicionar Profissional"
              onPress={() =>
                router.push({
                  pathname: "/(owner)/add-professional",
                  params: { establishmentId: establishmentId ?? "" },
                } as any)
              }
              mt="$4"
            />
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
