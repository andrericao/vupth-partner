import { useState, useEffect, useCallback } from "react";
import { VStack, HStack, Heading, Text, ScrollView } from "@gluestack-ui/themed";
import { Alert } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { Button } from "@components/Button";
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
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton onBack={() => router.navigate("/(professional)/settings" as any)} />

        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Vinculo
        </Heading>

        {invites.length > 0 && (
          <VStack
            mt="$6"
            bg="$green50"
            p="$4"
            borderRadius="$lg"
            borderWidth="$1"
            borderColor="$green200"
            space="sm"
          >
            <Text fontFamily="$heading" fontWeight="$bold" color="$green700">
              Convites de vinculacao
            </Text>
            {invites.map((inv) => (
              <VStack key={inv.id} bg="$white" p="$3" borderRadius="$md" borderWidth="$1" borderColor="$coolGray200">
                <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
                  Convite de
                </Text>
                <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900" mb="$2">
                  {inv.establishmentName ?? "Estabelecimento"}
                </Text>
                <HStack space="sm">
                  <Button
                    title="Recusar"
                    onPress={() => handleRejectInvite(inv)}
                    isLoading={resolvingInvite === inv.id}
                    bg="transparent"
                    $active-bg="$red50"
                    borderWidth="$1"
                    borderColor="$red500"
                    textColor="$red500"
                    h="$9"
                    flex={1}
                  />
                  <Button
                    title="Aceitar"
                    onPress={() => handleAcceptInvite(inv)}
                    isLoading={resolvingInvite === inv.id}
                    bg="$green500"
                    $active-bg="$green600"
                    h="$9"
                    flex={1}
                  />
                </HStack>
              </VStack>
            ))}
          </VStack>
        )}

        <VStack mt="$6" bg="$coolGray50" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200">
          <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
            Estabelecimento
          </Text>
          <Text fontFamily="$heading" fontWeight="$bold" color={professional?.establishment_name ? "$green700" : "$coolGray400"} mt="$1">
            {professional?.establishment_name ?? "Nao vinculado"}
          </Text>
          {!professional?.establishment_id ? (
            <Button
              title="Buscar Estabelecimento"
              onPress={() => router.push("/(professional)/find-establishment" as any)}
              bg="$green500"
              $active-bg="$green600"
              h="$9"
              mt="$2"
            />
          ) : (
            <Button
              title="Desafiliar do Estabelecimento"
              onPress={handleLeave}
              isLoading={isLeaving}
              bg="transparent"
              $active-bg="$red50"
              borderWidth="$1"
              borderColor="$red500"
              textColor="$red500"
              h="$9"
              mt="$2"
            />
          )}
        </VStack>
      </VStack>
    </ScrollView>
  );
}
