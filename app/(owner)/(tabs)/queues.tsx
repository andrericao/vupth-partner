import { useState, useCallback } from "react";
import { Avatar } from "@components/Avatar";
import { nomeDaEspecialidade } from "@lib/especialidade";
import { useVoltarAoTopo, usePilulaTopo } from "@hooks/useVoltarAoTopo";
import { PilulaVoltarAoTopo } from "@components/PilulaVoltarAoTopo";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { Star } from "lucide-react-native";
import { ScreenHeader } from "@components/ScreenHeader";
import { SkeletonList } from "@components/Skeleton";
import { useLocalSearchParams, router } from "expo-router";
import { NwButton } from "@components/nw/Button";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { useEstablishmentStore } from "@store/establishment.store";
import { ratingLabel } from "@lib/rating";
import type { ProfessionalWithQueue, AttendanceInQueue } from "@lib/types";
import { useTema } from "@hooks/useTema";

function AttendanceItem({ attendance }: { attendance: AttendanceInQueue }) {
  const statusLabel =
    attendance.status === "IN_PROGRESS"
      ? "Atendendo"
      : attendance.status === "PAUSED"
        ? "Pausado"
        : "Aguardando";
  // Pausado e o unico que pede atencao: fica pessego (a cor, nao o fundo
  // `warning`, que no escuro e marrom escuro). Atendendo e aguardando sao
  // estados normais e ficam no texto padrao.
  const statusClasse =
    attendance.status === "PAUSED" ? "text-vupth-pessego" : "text-vupth-textPrimary";

  return (
    <View className="flex-row justify-between items-center py-2 px-3 border-b border-vupth-surface">
      <View className="flex-1">
        <Text className="font-body text-sm text-vupth-textPrimary">{attendance.clientName}</Text>
        <Text className="font-body text-xs text-vupth-textSecondary">
          {attendance.services.map((sv) => sv.customName).join(", ")}
        </Text>
      </View>
      <View className="items-end">
        <Text className={`font-body text-xs ${statusClasse}`}>{statusLabel}</Text>
        <Text className="font-body text-xs text-vupth-textSecondary">
          R$ {attendance.totalValue.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

function ProfessionalCard({
  professional,
  establishmentId,
}: {
  professional: ProfessionalWithQueue;
  establishmentId: string;
}) {
  const { cores } = useTema();
  const [expanded, setExpanded] = useState(false);
  const allAttendances = [
    ...(professional.current_attendance ? [professional.current_attendance] : []),
    ...professional.waiting_list,
  ];

  return (
    <View className="bg-vupth-surface rounded-card mb-3 overflow-hidden">
      <Pressable onPress={() => setExpanded(!expanded)} className="py-3 px-4">
        <View className="flex-row justify-between items-center gap-3">
          <Avatar nome={professional.name} uri={professional.profile_image_url} tamanho={40} />
          <View className="flex-1">
            <Text className="font-heading text-vupth-textPrimary">{professional.name}</Text>
            <Text className="font-body text-sm text-vupth-textSecondary">
              {nomeDaEspecialidade(professional.specialty)}
            </Text>
            {ratingLabel(professional.rating_average, professional.rating_count) && (
              <View className="flex-row items-center gap-1 mt-0.5">
                <Star size={12} color={cores.textSecondary} fill={cores.textSecondary} />
                <Text className="font-body text-xs text-vupth-textSecondary">
                  {ratingLabel(professional.rating_average, professional.rating_count)}
                </Text>
              </View>
            )}
          </View>
          <View className="items-end">
            <View
              className={`px-3 py-1 rounded-md ${
                professional.queue_count > 0 ? "bg-vupth-greenTint" : "bg-vupth-background"
              }`}
            >
              <Text
                className={`font-body text-xs ${
                  professional.queue_count > 0 ? "text-vupth-onGreenTint" : "text-vupth-textSecondary"
                }`}
              >
                {professional.queue_count} na fila
              </Text>
            </View>
            <Text className="font-body text-xs text-vupth-textSecondary mt-1">
              {professional.estimated_wait_minutes} min
            </Text>
          </View>
        </View>
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
          className="py-2 px-4 bg-vupth-greenTint border-t border-vupth-surface"
        >
          <Text className="font-body text-sm text-vupth-onGreenTint text-center">
            Ver fila detalhada
          </Text>
        </Pressable>
      )}

      {expanded && allAttendances.length > 0 && (
        <View className="border-t border-vupth-surface">
          {allAttendances.map((att) => (
            <AttendanceItem key={att.id} attendance={att} />
          ))}
        </View>
      )}

      {expanded && allAttendances.length === 0 && (
        <View className="py-3 px-4 border-t border-vupth-surface">
          <Text className="font-body text-sm text-vupth-textSecondary text-center">
            Nenhum cliente na fila
          </Text>
        </View>
      )}
    </View>
  );
}

export default function OwnerQueuesScreen() {
  // Tocar na aba JA ATIVA volta ao topo (Andre, 18/09).
  const rolagemRef = useVoltarAoTopo();
  const pilula = usePilulaTopo(rolagemRef);

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
        <View className="flex-1 pb-8 px-4">
          {/* Sem botao de voltar: virou raiz de aba. O subtitulo carrega o total
              que antes ocupava dois cartões de número — o dono já ve a contagem
              por profissional logo abaixo, entao repetir o agregado em destaque
              só empurrava a lista pra baixo. */}
          <ScreenHeader
            title="Filas"
            subtitle={
              data
                ? data.total_in_queue === 0
                  ? "Ninguém esperando agora"
                  : `${data.total_in_queue} ${data.total_in_queue === 1 ? "pessoa esperando" : "pessoas esperando"} agora`
                : "Carregando..."
            }
          />
  
          {isLoading && !data && (
            <View className="mt-6">
              <SkeletonList count={3} />
            </View>
          )}
  
          {professionals.map((prof) => (
            <ProfessionalCard
              key={prof.id}
              professional={prof}
              establishmentId={establishmentId ?? ""}
            />
          ))}
  
          {!isLoading && professionals.length === 0 && (
            <View className="items-center mt-12">
              <Text className="font-body text-vupth-textSecondary text-center">
                Nenhum profissional cadastrado
              </Text>
              <NwButton
                title="Adicionar profissional"
                onPress={() =>
                  router.push({
                    pathname: "/(owner)/add-professional",
                    params: { establishmentId: establishmentId ?? "" },
                  } as any)
                }
                className="mt-4"
              />
            </View>
          )}
        </View>
      </ScrollView>
      <PilulaVoltarAoTopo visivel={pilula.visivel} onPress={pilula.subir} />
    </View>
  );
}
