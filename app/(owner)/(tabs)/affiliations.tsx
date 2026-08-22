import { useState, useEffect, useCallback } from "react";
import {
  VStack,
  HStack,
  Text,
  ScrollView,
  Badge,
  BadgeText,
} from "@gluestack-ui/themed";
import { SkeletonList } from "@components/Skeleton";
import { Alert, RefreshControl } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { Button } from "@components/Button";
import { BrandButton } from "@components/brand/Button";
import { api, getApiErrorMessage } from "@lib/api";

type Affiliation = {
  id: string;
  professionalId: string;
  professionalName: string;
  establishmentId: string;
  establishmentName: string;
  type: "REQUEST" | "INVITATION";
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  createdAt: string;
};

export default function OwnerAffiliationsScreen() {
  const { establishmentId } = useLocalSearchParams<{ establishmentId: string }>();
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAffiliations = useCallback(async () => {
    if (!establishmentId) return;
    try {
      const { data } = await api.get(
        `/establishment/${establishmentId}/affiliations`
      );
      setAffiliations(data);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível carregar as solicitações."));
    } finally {
      setIsLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    // fetch on-mount; sinaliza isLoading (padrao de carregamento).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAffiliations();
  }, [fetchAffiliations]);

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
  const resolved = affiliations.filter((a) => a.status !== "PENDING");

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <VStack flex={1} pb="$12" px="$4">
        <ScreenHeader
          title="Solicitações"
          subtitle="Profissionais que pediram para se vincular ao seu estabelecimento."
          onBack={() => router.navigate("/(owner)/menu" as any)}
        />

        {isLoading && (
          <VStack mt="$6">
            <SkeletonList count={3} />
          </VStack>
        )}

        {!isLoading && pending.length === 0 && resolved.length === 0 && (
          <VStack alignItems="center" mt="$12">
            <Text fontFamily="$body" color="$brandTextSecondary" textAlign="center">
              Nenhuma solicitação recebida ainda.
            </Text>
            <Text fontFamily="$body" color="$brandTextSecondary" textAlign="center" mt="$2" fontSize="$sm">
              Profissionais podem buscar seu estabelecimento pelo nome e solicitar vinculação.
            </Text>
          </VStack>
        )}

        {pending.length > 0 && (
          <VStack mb="$4">
            <Text fontFamily="$heading" fontWeight="$bold" mb="$2" color="$brandTextSecondary">
              Pendentes ({pending.length})
            </Text>
            {pending.map((aff) => (
              <VStack
                key={aff.id}
                bg="$brandSurface"
                p="$4"
                borderRadius="$md"
                borderWidth="$1"
                borderColor="$brandWarning"
                mb="$2"
              >
                <Text fontFamily="$heading" fontWeight="$bold" color="$forest">
                  {aff.professionalName}
                </Text>
                <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary" mt="$1">
                  {aff.type === "REQUEST" ? "Solicitou vinculação" : "Convite enviado"}
                </Text>
                <HStack mt="$3" space="sm">
                  <BrandButton
                    title="Aceitar"
                    onPress={() => handleAccept(aff)}
                    isLoading={actionLoading === aff.id}
                    h="$9"
                    flex={1}
                  />
                  <Button
                    title="Rejeitar"
                    onPress={() => handleReject(aff)}
                    isLoading={actionLoading === aff.id}
                    bg="$brandDanger"
                    $active-bg="$brandDanger"
                    h="$9"
                    flex={1}
                  />
                </HStack>
              </VStack>
            ))}
          </VStack>
        )}

        {resolved.length > 0 && (
          <VStack>
            <Text fontFamily="$heading" fontWeight="$bold" mb="$2" color="$brandTextSecondary">
              Historico
            </Text>
            {resolved.map((aff) => (
              <HStack
                key={aff.id}
                py="$3"
                px="$4"
                bg="$brandSurface"
                borderRadius="$card"
                mb="$2"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text fontFamily="$body" color="$forest">
                  {aff.professionalName}
                </Text>
                <Badge
                  action={aff.status === "ACCEPTED" ? "success" : "error"}
                  variant="solid"
                  borderRadius="$md"
                >
                  <BadgeText fontSize="$xs">
                    {aff.status === "ACCEPTED" ? "Aceito" : aff.status === "REJECTED" ? "Rejeitado" : "Cancelado"}
                  </BadgeText>
                </Badge>
              </HStack>
            ))}
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
