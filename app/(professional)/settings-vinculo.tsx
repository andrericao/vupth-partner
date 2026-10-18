import { useState, useEffect, useCallback } from "react";
import { SkeletonTexto } from "@components/Skeleton";
import { View, Text, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwButton } from "@components/nw/Button";
import { useProfessionalStore } from "@store/professional.store";
import { getApiErrorMessage } from "@lib/api";
import { confirmar } from "@lib/confirmar";
import { AvisoLojaDesativada } from "@components/AvisoLojaDesativada";
import { ConvitesDePosse } from "@components/ConvitesDePosse";
import {
  aceitarPosse,
  recusarPosse,
  listarConvitesDePosse,
  mensagemDaPosse,
  type ConviteDePosse,
} from "@lib/posseDaLoja";

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

  // Convites de POSSE (desativar-conta, S41): um dono quer passar a loja dele.
  const fetchMe = useProfessionalStore((s) => s.fetchMe);
  const [convitesDePosse, setConvitesDePosse] = useState<ConviteDePosse[]>([]);
  const [respondendoPosse, setRespondendoPosse] = useState<string | null>(null);

  const loadConvitesDePosse = useCallback(async () => {
    try {
      const todos = await listarConvitesDePosse();
      setConvitesDePosse(todos.filter((c) => c.status === "PENDING"));
    } catch {}
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConvitesDePosse();
  }, [loadConvitesDePosse]);

  const responderPosse = async (id: string, aceitar: boolean) => {
    setRespondendoPosse(id);
    try {
      if (aceitar) await aceitarPosse(id);
      else await recusarPosse(id);
      setConvitesDePosse((prev) => prev.filter((c) => c.id !== id));
      if (aceitar) {
        await fetchMe().catch(() => {});
        Alert.alert("Posse aceita", "Agora a loja é sua. Entre de novo para ver o painel do dono.");
      }
    } catch (error: any) {
      Alert.alert("Erro", mensagemDaPosse(error));
    } finally {
      setRespondendoPosse(null);
    }
  };

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
    confirmar({
      titulo: "Aceitar vinculação",
      mensagem: `Deseja se vincular a ${nome}? Você passara a atender por este estabelecimento.`,
      confirmar: "Aceitar",
    }).then((ok) => {
      if (ok) doAcceptInvite(inv);
    });
  };

  const handleRejectInvite = (inv: any) => {
    const nome = inv.establishmentName ?? "este estabelecimento";
    confirmar({
      titulo: "Recusar convite",
      mensagem: `Deseja recusar o convite de ${nome}?`,
      confirmar: "Recusar",
      destrutivo: true,
    }).then((ok) => {
      if (ok) doRejectInvite(inv);
    });
  };

  const handleLeave = async () => {
    const ok = await confirmar({
      titulo: "Desafiliar do estabelecimento",
      mensagem: `Você deixará de atender em ${professional?.establishment_name ?? "este estabelecimento"} e não receberá novos clientes na fila. Deseja continuar?`,
      confirmar: "Desafiliar",
      destrutivo: true,
    });
    if (!ok) return;

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

        <View className="gap-3">
          <AvisoLojaDesativada
            status={professional?.establishment_status}
            nomeDaLoja={professional?.establishment_name}
          />
          <ConvitesDePosse
            convites={convitesDePosse}
            ocupadoId={respondendoPosse}
            onAceitar={(id) => responderPosse(id, true)}
            onRecusar={(id) => responderPosse(id, false)}
          />
        </View>

        {invites.length > 0 && (
          <View className="mt-6 bg-vupth-greenTint p-4 rounded-lg border border-vupth-onGreenTint gap-2">
            <Text className="font-heading text-vupth-onGreenTint">
              Convites de vinculação
            </Text>
            {invites.map((inv) => (
              <View key={inv.id} className="bg-vupth-background p-3 rounded-md border border-vupth-border">
                <Text className="font-body text-sm text-vupth-textSecondary">Convite de</Text>
                <Text className="font-heading text-vupth-textPrimary mb-2">
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

        {/* vinculo-botao-corta-card (PAR-17, Andre 15/10): o h-9 brigava com o
            min-h-[54px] da pilula e o botao passava da base do card. Sem altura
            fixa, o card cresce com o botao. */}
        <View className="mt-6 bg-vupth-surface p-4 rounded-lg border border-vupth-border">
          <Text className="font-body text-sm text-vupth-textSecondary">Estabelecimento</Text>
          {/* Sem o perfil ainda nao se sabe se ha vinculo: skeleton (e nenhum
              botao), nao "Não vinculado" — Andre, 02/10. */}
          {!professional ? (
            <View className="mt-2">
              <SkeletonTexto largura={140} altura={16} testID="vinculo-carregando" />
            </View>
          ) : (
            <Text
              className={`font-heading mt-1 ${
                professional.establishment_name ? "text-vupth-textPrimary" : "text-vupth-textSecondary"
              }`}
            >
              {professional.establishment_name ?? "Não vinculado"}
            </Text>
          )}
          {!professional ? null : !professional.establishment_id ? (
            <NwButton
              title="Buscar estabelecimento"
              onPress={() => router.push("/(professional)/find-establishment" as any)}
              className="mt-3"
            />
          ) : (
            <NwButton
              title="Desafiliar do Estabelecimento"
              onPress={handleLeave}
              isLoading={isLeaving}
              variant="outlineDanger"
              className="mt-3"
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}
