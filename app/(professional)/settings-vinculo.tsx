import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { NwButton } from "@components/nw/Button";
import { useProfessionalStore } from "@store/professional.store";
import { getApiErrorMessage } from "@lib/api";

// Nav v2 etapa 3 (Andre 2026-07-23): tudo sobre o VINCULO com o estabelecimento
// em um lugar so — convites pendentes do owner, buscar e desafiliar. Antes
// vivia espalhado no fim da Configuracoes gigante.
export default function SettingsVinculoScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  const leaveEstablishment = useProfessionalStore((s) => s.leaveEstablishment);
  const fetchMyAffiliations = useProfessionalStore((s) => s.fetchMyAffiliations);
  const acceptAffiliation = useProfessionalStore((s) => s.acceptAffiliation);
  const rejectAffiliation = useProfessionalStore((s) => s.rejectAffiliation);

  // Convites de vinculacao recebidos do owner (type INVITATION, PENDING).
  const [invites, setInvites] = useState<any[]>([]);
  const [resolvingInvite, setResolvingInvite] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const loadInvites = useCallback(async () => {
    try {
      const all = await fetchMyAffiliations();
      setInvites(
        (all ?? []).filter((a: any) => a.status === "PENDING" && a.type === "INVITATION")
      );
    } catch {}
  }, [fetchMyAffiliations]);

  useEffect(() => {
    // carrega convites on-mount; setInvites e o efeito desejado do fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInvites();
  }, [loadInvites]);

  const doAcceptInvite = async (inv: any) => {
    setResolvingInvite(inv.id);
    try {
      await acceptAffiliation(inv.id);
      setInvites((prev) => prev.filter((i) => i.id !== inv.id));
      Alert.alert("Vinculado", `Voce agora esta vinculado a ${inv.establishmentName ?? "este estabelecimento"}.`);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel aceitar o convite."));
    } finally {
      setResolvingInvite(null);
    }
  };

  const doRejectInvite = async (inv: any) => {
    setResolvingInvite(inv.id);
    try {
      await rejectAffiliation(inv.id);
      setInvites((prev) => prev.filter((i) => i.id !== inv.id));
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel recusar o convite."));
    } finally {
      setResolvingInvite(null);
    }
  };

  // R3: confirmacao antes de decidir a vinculacao.
  const handleAcceptInvite = (inv: any) => {
    const nome = inv.establishmentName ?? "este estabelecimento";
    Alert.alert(
      "Aceitar vinculacao",
      `Deseja se vincular a ${nome}? Voce passara a atender por este estabelecimento.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Aceitar", onPress: () => doAcceptInvite(inv) },
      ]
    );
  };

  const handleRejectInvite = (inv: any) => {
    const nome = inv.establishmentName ?? "este estabelecimento";
    Alert.alert(
      "Recusar convite",
      `Deseja recusar o convite de ${nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Recusar", style: "destructive", onPress: () => doRejectInvite(inv) },
      ]
    );
  };

  const handleLeave = () => {
    Alert.alert(
      "Desafiliar do estabelecimento",
      `Voce deixara de atender em ${professional?.establishment_name ?? "este estabelecimento"} e nao recebera novos clientes na fila. Deseja continuar?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desafiliar",
          style: "destructive",
          onPress: async () => {
            setIsLeaving(true);
            try {
              await leaveEstablishment();
              Alert.alert(
                "Desafiliado",
                "Voce nao esta mais vinculado ao estabelecimento. Busque um novo estabelecimento quando quiser voltar a atender."
              );
            } catch (error: any) {
              Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel desafiliar do estabelecimento. Tente novamente."));
            } finally {
              setIsLeaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      className="w-full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 py-12 px-6">
        <Header showBackButton onBack={() => router.navigate("/(professional)/settings" as any)} />

        <Text className="font-heading text-2xl text-gray-900 mt-8">Vinculo</Text>

        {invites.length > 0 && (
          <View className="mt-6 bg-brand-50 p-4 rounded-lg border border-brand-200 gap-2">
            <Text className="font-heading text-brand-700">
              Convites de vinculacao
            </Text>
            {invites.map((inv) => (
              <View key={inv.id} className="bg-white p-3 rounded-md border border-gray-200">
                <Text className="font-body text-sm text-gray-500">Convite de</Text>
                <Text className="font-heading text-gray-900 mb-2">
                  {inv.establishmentName ?? "Estabelecimento"}
                </Text>
                <View className="flex-row gap-2">
                  <NwButton
                    title="Recusar"
                    onPress={() => handleRejectInvite(inv)}
                    isLoading={resolvingInvite === inv.id}
                    variant="outlineDanger"
                    className="flex-1 h-9 mt-0"
                  />
                  <NwButton
                    title="Aceitar"
                    onPress={() => handleAcceptInvite(inv)}
                    isLoading={resolvingInvite === inv.id}
                    className="flex-1 h-9 mt-0"
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <Text className="font-body text-sm text-gray-500">Estabelecimento</Text>
          <Text
            className={`font-heading mt-1 ${
              professional?.establishment_name ? "text-brand-700" : "text-gray-400"
            }`}
          >
            {professional?.establishment_name ?? "Nao vinculado"}
          </Text>
          {!professional?.establishment_id ? (
            <NwButton
              title="Buscar Estabelecimento"
              onPress={() => router.push("/(professional)/find-establishment" as any)}
              className="h-9 mt-2"
            />
          ) : (
            <NwButton
              title="Desafiliar do Estabelecimento"
              onPress={handleLeave}
              isLoading={isLeaving}
              variant="outlineDanger"
              className="h-9 mt-2"
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}
