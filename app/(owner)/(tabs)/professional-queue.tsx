import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  Pressable,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { RotateCw } from "lucide-react-native";
import { NwButton } from "@components/nw/Button";
import { useElapsedTime } from "@hooks/useElapsedTime";
import { useProfessionalQueue } from "@hooks/useProfessionalQueue";
import { useEstablishmentStore } from "@store/establishment.store";
import { getApiErrorMessage } from "@lib/api";
import type { AttendanceInQueue } from "@lib/types";
import { confirmar, avisar } from "@lib/confirmar";
import { ehMeuAtendimento } from "@lib/meuAtendimento";
import { finalizarAtendimento } from "@lib/finalizar";
import { pedirFeedbackDoApp } from "@lib/feedbackDoApp";
import { useAttendanceStore } from "@store/attendance.store";
import { useProfessionalStore } from "@store/professional.store";
import { useTema } from "@hooks/useTema";
import { formatarReais } from "@lib/dinheiro";

function QueueItem({ attendance, position }: { attendance: AttendanceInQueue; position: number }) {
  const statusLabel =
    attendance.status === "IN_PROGRESS"
      ? "Atendendo"
      : attendance.status === "PAUSED"
        ? "Pausado"
        : `#${position}`;
  const statusColor =
    attendance.status === "PAUSED" ? "text-vupth-pessego" : "text-vupth-textPrimary";

  return (
    <View className="flex-row items-center justify-between py-3 px-4 bg-vupth-surface rounded-card mb-2">
      <View className="flex-1">
        <Text className="font-heading text-vupth-textPrimary">{attendance.clientName}</Text>
        <Text className="font-body text-xs text-vupth-textSecondary">
          {attendance.services.map((s) => s.customName).join(", ")}
        </Text>
      </View>
      <View className="items-end">
        <Text className={`font-body text-sm font-bold ${statusColor}`}>{statusLabel}</Text>
        <Text className="font-body text-xs text-vupth-textSecondary">
          {formatarReais(attendance.totalValue)}
        </Text>
      </View>
    </View>
  );
}

/**
 * ⚠️ Os botoes aparecem SO quando o atendimento e de quem esta logado — ver
 * `ehMeuAtendimento`. A tela do dono e LEITURA sobre o trabalho dos outros: os
 * botoes dados a ela em 08/09 foram revertidos no mesmo dia porque "o dono nao
 * finaliza nada, quem finaliza e o profissional" (`194af84`).
 *
 * Quando o dono E o profissional, isso nao e excecao — o atendimento e dele. E
 * e o unico caminho que ele tem: quem acumula os dois papeis cai na area do
 * dono ao logar (`routing.ts`), e a ponte para a area do profissional e um
 * `router.replace` de MAO UNICA, sem volta.
 */
function CurrentAttendanceCard({
  attendance,
  meu,
  onFinish,
  onPause,
  onResume,
  ocupado,
}: {
  attendance: any;
  meu: boolean;
  onFinish: () => void;
  onPause: () => void;
  onResume: () => void;
  ocupado: boolean;
}) {
  const { formatted } = useElapsedTime(
    attendance.id ?? null,
    attendance.startTime ?? null,
    attendance.isPaused ?? false,
    attendance.pausedTimeMinutes ?? null
  );

  return (
    <View className="bg-vupth-greenTint p-4 rounded-card mb-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-heading text-lg text-vupth-onGreenTint">{attendance.clientName}</Text>
        {/* O Badge success do v1: fundo #EDFCF2, texto #2A7948 (config/theme/Badge.ts). */}
        {/* tema-fixo: badge do v1 (paleta antiga), claro sobre o cartao; migra junto com a tela */}
        <View className="bg-[#EDFCF2] border border-[#66B584] rounded-md px-2 py-0.5">
          {/* tema-fixo: idem */}
          <Text className="font-body text-xs font-bold text-[#2A7948]">
            {attendance.isPaused ? "PAUSADO" : "ATENDENDO"}
          </Text>
        </View>
      </View>
      <Text className="font-body text-sm text-vupth-onGreenTint mt-1">
        {attendance.services?.map((s: any) => s.customName).join(", ")}
      </Text>
      <View className="flex-row justify-between mt-2">
        <Text className="font-body text-sm text-vupth-onGreenTint">Tempo: {formatted}</Text>
        <Text className="font-heading text-vupth-onGreenTint">
          {formatarReais((attendance.totalValue ?? 0))}
        </Text>
      </View>

      {meu ? (
        <View className="flex-row gap-2 mt-4">
          {/* `finalizarAtendimento` (a MESMA do profissional) atravessa o
              pausado: o backend so aceita `finish` em IN_PROGRESS (S36), entao
              ela retoma antes. Chamar `finishAttendance` direto aqui recriaria
              o beco que o 08/09 fechou do outro lado. */}
          <NwButton title="Finalizar" onPress={onFinish} isLoading={ocupado} className="flex-1" />
          {/* Contornado, como o do profissional: os dois lado a lado nao podem
              ser iguais. */}
          <NwButton
            title={attendance.isPaused ? "Retomar" : "Pausar"}
            variant="vupthOutline"
            onPress={attendance.isPaused ? onResume : onPause}
            isLoading={ocupado}
            className="flex-1"
          />
        </View>
      ) : null}
    </View>
  );
}

export default function ProfessionalQueueScreen() {
  const { cores } = useTema();
  const { professionalId, establishmentId, professionalName } = useLocalSearchParams<{
    professionalId: string;
    establishmentId: string;
    professionalName: string;
  }>();

  const { data, isLoading, refetch } = useProfessionalQueue(
    professionalId ?? null,
    establishmentId ?? null
  );

  const [refreshing, setRefreshing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const removeProfessional = useEstablishmentStore((s) => s.removeProfessional);

  // A REGRA mora numa funcao com nome, nao num ternario aqui: o que decide nao e
  // a tela, e de quem e o atendimento. Ver `ehMeuAtendimento`.
  const euLogado = useProfessionalStore((st) => st.professional)?.id;
  const meuAtendimento = ehMeuAtendimento(professionalId, euLogado);
  const { finishAttendance, resumeAttendance, pauseAttendance } = useAttendanceStore();
  const [agindo, setAgindo] = useState(false);

  const agir = async (fn: () => Promise<void>, erro: string) => {
    if (agindo) return;
    setAgindo(true);
    try {
      await fn();
      await refetch();
    } catch (e: any) {
      avisar({ titulo: "Erro", mensagem: getApiErrorMessage(e, erro) });
    } finally {
      setAgindo(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleRemove = async () => {
    if (!establishmentId || !professionalId) return;
    const name = data?.professionalName ?? professionalName ?? "este profissional";
    const ok = await confirmar({
      titulo: "Desvincular profissional",
      mensagem: `${name} deixa de atender aqui.`,
      confirmar: "Desvincular",
      destrutivo: true,
    });
    if (!ok) return;

    setIsRemoving(true);
    try {
      await removeProfessional(establishmentId, professionalId);
      // O profissional JA FOI desvinculado. Com `Alert.alert` a web nao mostrava
      // nada e a navegacao nao acontecia — o dono ficava parado na tela de quem
      // acabara de remover.
      await avisar({
        titulo: "Desvinculado",
        mensagem: `${name} foi removido do estabelecimento.`,
      });
      router.navigate("/(owner)/dashboard" as any);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível desvincular o profissional. Verifique se não há atendimento em andamento."));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <ScrollView
      className="w-full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader
          title={data?.professionalName ?? professionalName ?? "Fila"}
          onBack={() => router.navigate("/(owner)/dashboard" as any)}
          action={
            /* Puxar-para-atualizar e gesto de dedo: no navegador o
               RefreshControl nao responde ao mouse, e esta tela ficava sem
               NENHUMA forma de atualizar a fila (device, 08/09). */
            Platform.OS === "web" ? (
              <Pressable
                onPress={onRefresh}
                accessibilityRole="button"
                accessibilityLabel="Atualizar a fila"
                testID="atualizar-fila-dono"
                hitSlop={8}
                disabled={refreshing}
              >
                <RotateCw size={20} color={cores.textPrimary} />
              </Pressable>
            ) : undefined
          }
        />

        {data && (
          <>
            <Text className="font-body text-vupth-textSecondary mt-1">{data.establishmentName}</Text>

            <View className="flex-row gap-3 my-4">
              <View className="flex-1 bg-vupth-greenTint p-3 rounded-card">
                <Text className="font-body text-xs text-vupth-onGreenTint">Na fila</Text>
                <Text className="font-heading text-xl text-vupth-onGreenTint">{data.size}</Text>
              </View>
              <View className="flex-1 bg-vupth-greenTint p-3 rounded-card border border-blue-200">
                <Text className="font-body text-xs text-blue-700">Espera total</Text>
                <Text className="font-heading text-xl text-vupth-onGreenTint">
                  {data.totalRemainingMinutes} min
                </Text>
              </View>
            </View>

            <View className="h-px bg-vupth-border mb-4" />
          </>
        )}

        {isLoading && !data && (
          <View className="flex-1 items-center justify-center mt-12">
            <ActivityIndicator color={cores.textPrimary} size="large" />
            <Text className="font-body text-vupth-textSecondary mt-4">Carregando fila...</Text>
          </View>
        )}

        {data?.inAttendance && (
          <View className="mb-2">
            <Text className="font-heading text-vupth-textSecondary mb-2">Em Atendimento</Text>
            <CurrentAttendanceCard
              attendance={data.inAttendance}
              meu={meuAtendimento}
              ocupado={agindo}
              onFinish={() =>
                agir(
                  () =>
                    finalizarAtendimento(
                      (data.inAttendance as any).id,
                      (data.inAttendance as any).isPaused ?? false,
                      { retomar: resumeAttendance, finalizar: finishAttendance }
                    ).then(() => void pedirFeedbackDoApp("dono")),
                  "Não foi possível finalizar o atendimento."
                )
              }
              onPause={() =>
                agir(
                  () => pauseAttendance((data.inAttendance as any).id),
                  "Não foi possível pausar o atendimento."
                )
              }
              onResume={() =>
                agir(
                  () => resumeAttendance((data.inAttendance as any).id).then(() => undefined),
                  "Não foi possível retomar o atendimento."
                )
              }
            />
          </View>
        )}

        {data && data.attendancesInQueue.length > 0 && (
          <View>
            <Text className="font-heading text-vupth-textSecondary mb-2">
              Lista de Espera ({data.attendancesInQueue.length})
            </Text>
            {data.attendancesInQueue.map((att, i) => (
              <QueueItem key={att.id} attendance={att} position={i + 1} />
            ))}
          </View>
        )}

        {data && !data.inAttendance && data.attendancesInQueue.length === 0 && (
          <View className="flex-1 items-center justify-center mt-12">
            <Text className="font-body text-lg text-vupth-textSecondary text-center">
              Nenhum cliente na fila
            </Text>
          </View>
        )}

        <View className="h-px bg-vupth-border my-6" />

        <NwButton
          title="Desvincular profissional"
          variant="outlineDanger"
          onPress={handleRemove}
          isLoading={isRemoving}
        />
      </View>
    </ScrollView>
  );
}
