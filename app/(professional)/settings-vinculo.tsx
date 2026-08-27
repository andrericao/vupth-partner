import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
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

  // Convites de vinculação recebidos do owner (type INVITATION, PENDING).
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
      Alert.alert("Vinculado", `Você agora está vinculado a ${inv.establishmentName ?? "este estabelecimento"}.`);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível aceitar o convite."));
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
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível recusar o convite."));
    } finally {
      setResolvingInvite(null);
    }
  };

  // R3: confirmacao antes de decidir a vinculacao.
  const handleAcceptInvite = (inv: any) => {
    const nome = inv.establishmentName ?? "este estabelecimento";
    Alert.alert(
      "Aceitar vinculação",
      `Deseja se vincular a ${nome}? Você passara a atender por este estabelecimento.`,
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
      `Você deixará de atender em ${professional?.establishment_name ?? "este estabelecimento"} e não receberá novos clientes na fila. Deseja continuar?`,
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
                "Você não está mais vinculado ao estabelecimento. Busque um novo estabelecimento quando quiser voltar a atender."
              );
            } catch (error: any) {
              Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível desafiliar do estabelecimento. Tente novamente."));
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
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader
          title="Vínculo"
          onBack={() => router.navigate("/(professional)/settings" as any)}
        />

        {invites.length > 0 && (
          <View className="mt-6 bg-vupth-greenTint p-4 rounded-lg border border-vupth-forest gap-2">
            <Text className="font-heading text-vupth-forest">
              Convites de vinculação
            </Text>
            {invites.map((inv) => (
              <View key={inv.id} className="bg-white p-3 rounded-md border border-vupth-border">
                <Text className="font-body text-sm text-vupth-textSecondary">Convite de</Text>
                <Text className="font-heading text-vupth-forest mb-2">
                  {inv.establishmentName ?? "Estabelecimento"}
                </Text>
                <View className="flex-row gap-2">
                  <NwButton
                    title="Recusar"
                    onPress={() => handleRejectInvite(inv)}
                    isLoading={resolvingInvite === inv.id}
                    variant="secondary"
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

        <View className="mt-6 bg-vupth-surface p-4 rounded-lg border border-vupth-border">
          <Text className="font-body text-sm text-vupth-textSecondary">Estabelecimento</Text>
          <Text
            className={`font-heading mt-1 ${
              professional?.establishment_name ? "text-vupth-forest" : "text-vupth-textSecondary"
            }`}
          >
            {professional?.establishment_name ?? "Não vinculado"}
          </Text>
          {!professional?.establishment_id ? (
            <NwButton
              title="Buscar estabelecimento"
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
