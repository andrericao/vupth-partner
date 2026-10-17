import { useState, useCallback } from "react";
import { nomeDaEspecialidade } from "@lib/especialidade";
import { View, Text, Pressable, ScrollView, RefreshControl } from "react-native";
import { SkeletonList } from "@components/Skeleton";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { useEstablishmentStore } from "@store/establishment.store";
import { useRelatorioDoPeriodo, type Periodo } from "@hooks/useRelatorioDoPeriodo";
import { ExpedienteCard } from "@components/ExpedienteCard";
import { StatCard } from "@components/brand/StatCard";
import { avisoSemSplit } from "@lib/split";
import { RelatorioDasLojas } from "@components/RelatorioDasLojas";
import { NaoRealizadosCard } from "@components/NaoRealizadosCard";

type Period = Periodo;

export default function OwnerReportsScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const fetchReport = useEstablishmentStore((s) => s.fetchReport);
  const totalDeLojas = useEstablishmentStore((s) => s.lojas.length);
  const { data: queue, refetch } = useQueuePolling(establishment?.id ?? null);

  const [period, setPeriod] = useState<Period>("day");
  const [refreshing, setRefreshing] = useState(false);

  // O ultimo relatorio de cada periodo fica guardado: voltar a tela pinta o
  // numero na hora e atualiza por tras (fila do partner, 25/09).
  const establishmentId = establishment?.id ?? null;
  const {
    dados: report,
    carregando: isLoading,
    erro: errorMsg,
    recarregar: loadReport,
  } = useRelatorioDoPeriodo("dono", establishmentId, period, (de, ate) =>
    fetchReport(establishmentId!, de, ate)
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadReport(), refetch()]);
    setRefreshing(false);
  }, [loadReport, refetch]);

  const totalInQueue = queue?.total_in_queue ?? 0;
  const availableProfs = queue?.available_professionals ?? 0;

  // Breakdown do relatorio por profissional, indexado por id.
  const revById = (report?.professionals ?? []).reduce<
    Record<string, { revenue: number; attendances: number; netRevenue?: number | null }>
  >(
    (acc, p) => {
      acc[p.id] = { revenue: p.revenue, attendances: p.attendances, netRevenue: p.netRevenue };
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
      className="w-full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader
          title="Relatórios"
          subtitle={establishment?.name ?? undefined}
          onBack={() => router.navigate("/(owner)/menu" as any)}
        />

        {/* multi-loja-do-dono: com mais de uma loja, o resumo das lojas vem antes. */}
        {totalDeLojas > 1 && (
          <>
            <RelatorioDasLojas />
            <View className="h-px bg-vupth-border mt-6" />
          </>
        )}

        <Text className="font-heading text-vupth-textSecondary mt-6 mb-2">Agora</Text>
        <View className="flex-row gap-4">
          {/* "Na fila" so vira heroi quando HA fila: zero e a ausencia de
              fila, não o número que importa (mesma regra do dashboard). */}
          <StatCard flex={1} label="Na fila" value={String(totalInQueue)} hero={totalInQueue > 0} />
          <StatCard flex={1} label="Profissionais disponíveis" value={String(availableProfs)} />
        </View>

        <View className="flex-row gap-2 mt-6">
          {periods.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => setPeriod(p.key)}
              className={`py-2 px-4 rounded-full shrink-0 ${
                period === p.key ? "bg-vupth-forest" : "bg-vupth-surface"
              }`}
            >
              <Text
                numberOfLines={1}
                className={`font-body text-sm text-center ${
                  period === p.key ? "text-vupth-green" : "text-vupth-textSecondary"
                }`}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <ExpedienteCard periodo={period} workdays={report?.workdays} />

        {errorMsg && (
          <View className="bg-vupth-surface p-4 rounded-card mt-4">
            <Text className="font-body text-vupth-danger text-center">{errorMsg}</Text>
          </View>
        )}

        {isLoading ? (
          <View className="mt-6">
            <SkeletonList count={2} />
          </View>
        ) : (
          <>
            {/* Receita e o heroi da secao do periodo — o unico numero em
                dinheiro, e o que o dono abre o relatório pra ver. Vem PRIMEIRO
                pelo mesmo motivo (mesma ordem do relatório do profissional). */}
            <View className="flex-row gap-4 mt-4">
              <StatCard
                flex={1}
                label="Receita"
                value={`R$ ${Number(report?.totalRevenue ?? 0).toFixed(2)}`}
                hero
              />
              <StatCard flex={1} label="Atendimentos" value={String(report?.totalAttendances ?? 0)} />
            </View>

            <View className="flex-row gap-4 mt-3">
              <StatCard
                flex={1}
                label="Duração média"
                value={`${Math.round(report?.avgDurationMinutes ?? 0)} min`}
              />
              <View className="flex-1 bg-vupth-surface p-4 rounded-card">
                <Text className="font-display text-base text-vupth-forest">
                  {report?.topProfessional ?? "—"}
                </Text>
                <Text className="font-body text-xs text-vupth-textSecondary mt-1">destaque</Text>
              </View>
            </View>

            {avisoSemSplit(report?.attendancesWithoutSplit) && (
              <View className="bg-vupth-warning p-3 rounded-card mt-3">
                <Text className="font-body text-xs text-vupth-forest">
                  {avisoSemSplit(report?.attendancesWithoutSplit)}
                </Text>
              </View>
            )}

            <View className="mt-3">
              <NaoRealizadosCard naoRealizados={report?.notRealized} concluidosComAtraso={report?.finishedLate} />
            </View>

            <View className="h-px bg-vupth-border my-6" />

            <Text className="font-heading text-vupth-textSecondary mb-3">Por profissional</Text>

            {liveProfs.length === 0 ? (
              <Text className="font-body text-vupth-textSecondary text-center mt-4">
                Nenhum profissional vinculado
              </Text>
            ) : (
              <View className="gap-2">
                {liveProfs.map((p) => {
                  const r = revById[p.id] ?? { revenue: 0, attendances: 0 };
                  return (
                    <View key={p.id} className="bg-vupth-surface p-4 rounded-card">
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                          <Text className="font-heading text-vupth-forest">{p.name}</Text>
                          <Text className="font-body text-xs text-vupth-textSecondary">
                            {nomeDaEspecialidade(p.specialty) || "Sem especialidade"}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="font-heading text-vupth-forest">
                            R$ {r.revenue.toFixed(2)}
                          </Text>
                          {/* O que o profissional recebeu, sem as Taxas Vupth
                              — a base da comissao. Rotulo a validar com o Design. */}
                          {r.netRevenue != null && (
                            <Text className="font-body text-xs text-vupth-textSecondary">
                              recebe R$ {r.netRevenue.toFixed(2)}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View className="flex-row gap-4 mt-3">
                        <View className="flex-1">
                          <Text className="font-body text-xs text-vupth-textSecondary">Na fila</Text>
                          <Text className="font-heading text-vupth-textSecondary">{p.queue_count}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="font-body text-xs text-vupth-textSecondary">Espera</Text>
                          <Text className="font-heading text-vupth-textSecondary">
                            {p.estimated_wait_minutes} min
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="font-body text-xs text-vupth-textSecondary">Finalizados</Text>
                          <Text className="font-heading text-vupth-textSecondary">{r.attendances}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
