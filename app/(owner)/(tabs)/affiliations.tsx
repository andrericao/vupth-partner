import { useState, useCallback } from "react";
import { View, Text, ScrollView, Alert, RefreshControl } from "react-native";
import { SkeletonList } from "@components/Skeleton";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwButton } from "@components/nw/Button";
import { api, getApiErrorMessage } from "@lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { chaveDosVinculos } from "@hooks/useSolicitacoesDeVinculo";
import { historicoDeVinculos, diaDoVinculo } from "@lib/vinculos";

type Affiliation = {
  id: string;
  professionalId: string;
  professionalName: string;
  establishmentId: string;
  establishmentName: string;
  type: "REQUEST" | "INVITATION";
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  /** Quando foi aceito/recusado/cancelado (BAK 7e3e21b); nulo no PENDING. */
  resolvedAt?: string | null;
};

export default function OwnerAffiliationsScreen() {
  const { establishmentId } = useLocalSearchParams<{ establishmentId: string }>();
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const fetchAffiliations = useCallback(async () => {
    if (!establishmentId) return;
    try {
      // ?status=ALL (historico-de-vinculo, BAK 7e3e21b): sem ele a API so
      // manda os PENDING e o historico nunca aparece.
      const { data } = await api.get(
        `/establishment/${establishmentId}/affiliations`,
        { params: { status: "ALL" } }
      );
      setAffiliations(data);
      // O badge do Menu le a mesma lista: acompanha o que esta na tela.
      queryClient.setQueryData(chaveDosVinculos(establishmentId), data);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível carregar as solicitações."));
    } finally {
      setIsLoading(false);
    }
  }, [establishmentId, queryClient]);

  // A tela e uma aba escondida: fica montada depois da primeira visita. Rele a
  // cada vez que ganha o foco — senao um pedido novo nao aparece ao voltar.
  useFocusEffect(
    useCallback(() => {
      fetchAffiliations();
    }, [fetchAffiliations])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAffiliations();
    setRefreshing(false);
  }, [fetchAffiliations]);

  const handleAccept = async (affiliation: Affiliation) => {
    setActionLoading(affiliation.id);
    try {
      await api.patch(`/affiliations/${affiliation.id}/accept`);
      Alert.alert("Aceito", `${affiliation.professionalName} foi vinculado ao estabelecimento.`);
      await fetchAffiliations();
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Erro ao aceitar."));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (affiliation: Affiliation) => {
    setActionLoading(affiliation.id);
    try {
      await api.patch(`/affiliations/${affiliation.id}/reject`);
      await fetchAffiliations();
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Erro ao rejeitar."));
    } finally {
      setActionLoading(null);
    }
  };

  const pending = affiliations.filter((a) => a.status === "PENDING");
  const resolved = historicoDeVinculos(affiliations);

  return (
    <ScrollView
      className="w-full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader
          title="Solicitações"
          subtitle="Profissionais que pediram para se vincular ao seu estabelecimento."
          onBack={() => router.navigate("/(owner)/menu" as any)}
        />

        {isLoading && (
          <View className="mt-6">
            <SkeletonList count={3} />
          </View>
        )}

        {!isLoading && pending.length === 0 && resolved.length === 0 && (
          <View className="items-center mt-12">
            <Text className="font-body text-vupth-textSecondary text-center">
              Nenhuma solicitação recebida ainda.
            </Text>
            <Text className="font-body text-sm text-vupth-textSecondary text-center mt-2">
              Profissionais podem buscar seu estabelecimento pelo nome e solicitar vinculação.
            </Text>
          </View>
        )}

        {pending.length > 0 && (
          <View className="mb-4">
            <Text className="font-heading text-vupth-textSecondary mb-2">
              Pendentes ({pending.length})
            </Text>
            {pending.map((aff) => (
              /* A borda âmbar é o que separa o pendente do histórico: pede ação. */
              <View
                key={aff.id}
                className="bg-vupth-surface p-4 rounded-md border border-vupth-warning mb-2"
              >
                <Text className="font-heading text-vupth-forest">{aff.professionalName}</Text>
                <Text className="font-body text-xs text-vupth-textSecondary mt-1">
                  {aff.type === "REQUEST" ? "Solicitou vinculação" : "Convite enviado"}
                </Text>
                <View className="flex-row gap-2 mt-3">
                  <NwButton
                    title="Aceitar"
                    onPress={() => handleAccept(aff)}
                    isLoading={actionLoading === aff.id}
                    className="flex-1 h-9 mt-0"
                  />
                  <NwButton
                    title="Rejeitar"
                    onPress={() => handleReject(aff)}
                    isLoading={actionLoading === aff.id}
                    variant="danger"
                    className="flex-1 h-9 mt-0"
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {resolved.length > 0 && (
          <View>
            <Text className="font-heading text-vupth-textSecondary mb-2">Histórico</Text>
            {resolved.map((aff) => (
              <View
                key={aff.id}
                className="flex-row items-center justify-between py-3 px-4 bg-vupth-surface rounded-card mb-2"
              >
                <View className="flex-1">
                  <Text className="font-body text-vupth-forest">{aff.professionalName}</Text>
                  {!!diaDoVinculo(aff.resolvedAt) && (
                    <Text className="font-body text-xs text-vupth-textSecondary">
                      em {diaDoVinculo(aff.resolvedAt)}
                    </Text>
                  )}
                </View>
                <View
                  className={`px-3 py-1 rounded-md ${
                    aff.status === "ACCEPTED" ? "bg-vupth-greenTint" : "bg-vupth-dangerTint"
                  }`}
                >
                  <Text
                    className={`font-body text-xs ${
                      aff.status === "ACCEPTED" ? "text-vupth-forest" : "text-vupth-danger"
                    }`}
                  >
                    {aff.status === "ACCEPTED"
                      ? "Aceito"
                      : aff.status === "REJECTED"
                        ? "Rejeitado"
                        : "Cancelado"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
