import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { useProfessionalStore } from "@store/professional.store";
import { buscarAgendados, agruparPorDia, horaDoAgendado, DIAS_A_FRENTE } from "@lib/agendados";
import { formatarReais } from "@lib/dinheiro";

// agenda-do-profissional-partner: os agendamentos dos proximos dias, por dia.
// "Minha agenda" (agenda.tsx) segue sendo onde ele monta os horarios em que atende.
export default function AgendadosScreen() {
  const id = useProfessionalStore((s) => s.professional?.id) ?? null;
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["agendados", id],
    queryFn: () => buscarAgendados(id!),
    enabled: !!id,
    staleTime: 15_000,
  });
  const dias = agruparPorDia(data ?? []);

  return (
    <ScrollView
      className="w-full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader
          title="Agendamentos"
          subtitle={`Os clientes marcados nos próximos ${DIAS_A_FRENTE} dias.`}
          onBack={() => router.navigate("/(professional)/settings" as any)}
        />
        {dias.length === 0 && data !== undefined && (
          <Text testID="agendados-vazio" className="font-body text-vupth-textSecondary mt-6">
            Nenhum agendamento nos próximos dias.
          </Text>
        )}
        {dias.map((d) => (
          <View key={d.dia} className="mt-5" testID="agendados-dia">
            <Text className="font-body text-f11 font-bold tracking-wider text-vupth-textSecondary">
              {d.titulo.toUpperCase()}
            </Text>
            <View className="mt-2 gap-2">
              {d.itens.map((i) => (
                <View key={i.id} testID="agendado" className="bg-vupth-surface rounded-card px-4 py-3 flex-row justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="font-heading text-sm text-vupth-textPrimary">
                      {horaDoAgendado(i)} · {i.clientName}
                    </Text>
                    <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">
                      {(i.services ?? []).map((s) => s.customName).filter(Boolean).join(", ")}
                    </Text>
                  </View>
                  <Text className="font-heading text-sm text-vupth-textPrimary">{formatarReais(i.totalValue)}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
