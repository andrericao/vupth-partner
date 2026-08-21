import { useState, useEffect } from "react";
import {
  VStack,
  HStack,
  Text,
  Pressable,
  ScrollView,
  Spinner,
  Input as GluestackInput,
  InputField,
  InputSlot,
  InputIcon,
  SearchIcon,
  CloseIcon,
  ChevronRightIcon,
} from "@gluestack-ui/themed";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { Button } from "@components/Button";
import { BrandButton } from "@components/brand/Button";
import { SkeletonList } from "@components/Skeleton";
import { api, getApiErrorMessage } from "@lib/api";
import { serviceTypeLabel } from "@lib/serviceTypes";
import { useProfessionalStore } from "@store/professional.store";

type EstablishmentResult = {
  id: string;
  name: string;
  serviceType: string;
  openStatus: string;
};

// Profissional so pode trabalhar em um estabelecimento por vez:
// - affiliated: ja vinculado → nao pode solicitar a outro
// - pending: solicitacao em aberto → deve aguardar/cancelar antes de solicitar a outro
// - open: livre para buscar e solicitar
type Gate = "loading" | "affiliated" | "pending" | "open";

export default function FindEstablishmentScreen() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<EstablishmentResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [gate, setGate] = useState<Gate>("loading");
  const [blockedName, setBlockedName] = useState<string | null>(null);
  const [pendingAffiliationId, setPendingAffiliationId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadAll = async () => {
    setIsSearching(true);
    try {
      // includeAll=true: a busca de AFILIACAO deve listar TODOS os estabelecimentos,
      // inclusive os CLOSED/vazios (loja recem-criada nasce fechada). Sem isso, o
      // GET /establishment so devolve OPEN e um dono novo nunca e achado. O filtro
      // de prontidao (OPEN/bairro) e so da busca do CLIENTE. (Backend, 2026-07-11.)
      const { data } = await api.get("/establishment", {
        params: { includeAll: true },
      });
      setResults(data);
      setHasSearched(true);
    } catch {} finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await useProfessionalStore.getState().fetchMe();
        const prof = useProfessionalStore.getState().professional;
        if (prof?.establishment_id) {
          setBlockedName(prof.establishment_name ?? null);
          setGate("affiliated");
          return;
        }
        try {
          const { data: affs } = await api.get("/professional/me/affiliations");
          const pending = Array.isArray(affs)
            ? affs.find((a: any) => a.status === "PENDING")
            : null;
          if (pending) {
            setBlockedName(
              pending.establishmentName ?? pending.establishment_name ?? null
            );
            setPendingAffiliationId(pending.id ?? null);
            setGate("pending");
            return;
          }
        } catch {}
      } catch {}
      setGate("open");
      await loadAll();
    };
    init();
  }, []);

  const handleSearch = async () => {
    if (!search.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const { data } = await api.get("/establishment", {
        params: { name: search.trim(), includeAll: true },
      });
      setResults(data);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel buscar estabelecimentos."));
    } finally {
      setIsSearching(false);
    }
  };

  const openDetail = (establishment: EstablishmentResult) => {
    router.push({
      pathname: "/(professional)/establishment-detail",
      params: {
        id: establishment.id,
        name: establishment.name,
        serviceType: establishment.serviceType,
        openStatus: establishment.openStatus,
      },
    });
  };

  const handleCancelAffiliation = () => {
    if (!pendingAffiliationId) return;
    Alert.alert(
      "Cancelar solicitacao",
      `Deseja cancelar sua solicitacao para ${blockedName ?? "este estabelecimento"}? Voce podera solicitar a outro estabelecimento depois.`,
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Cancelar solicitacao",
          style: "destructive",
          onPress: async () => {
            setIsCancelling(true);
            try {
              await useProfessionalStore.getState().cancelAffiliation(pendingAffiliationId);
              setPendingAffiliationId(null);
              setBlockedName(null);
              setGate("open");
              await loadAll();
            } catch (error: any) {
              Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel cancelar a solicitacao."));
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <VStack flex={1} py="$12" px="$4">
          <ScreenHeader
          title="Buscar Estabelecimento"
          onBack={() => router.navigate("/(professional)/queue" as any)}
        />

          {gate === "loading" && (
            <VStack alignItems="center" mt="$12">
              <Spinner color="$forest" size="large" />
            </VStack>
          )}

          {gate === "affiliated" && (
            <VStack
              bg="$greenTint"
              p="$4"
              borderRadius="$card"
              borderWidth="$1"
              borderColor="$forest"
              mt="$6"
            >
              <Text fontFamily="$heading" fontWeight="$bold" color="$forest" mb="$2">
                Voce ja esta vinculado
              </Text>
              <Text fontFamily="$body" color="$coolGray600" mb="$4">
                Voce atende em {blockedName ?? "um estabelecimento"}. Um
                profissional so pode trabalhar em um estabelecimento por vez.
                Para mudar, desafilie-se em Configuracoes.
              </Text>
              <BrandButton
                title="Ir para Configuracoes"
                onPress={() => router.navigate("/(professional)/settings" as any)}
              />
            </VStack>
          )}

          {gate === "pending" && (
            <VStack
              bg="$amber50"
              p="$4"
              borderRadius="$card"
              borderWidth="$1"
              borderColor="$amber200"
              mt="$6"
            >
              <Text fontFamily="$heading" fontWeight="$bold" color="$amber700" mb="$2">
                Solicitacao em andamento
              </Text>
              <Text fontFamily="$body" color="$coolGray600" mb="$4">
                Voce ja solicitou vinculacao a {blockedName ?? "um estabelecimento"}{" "}
                e esta aguardando a resposta do proprietario. So e possivel
                solicitar a um estabelecimento por vez — aguarde o retorno ou
                cancele a solicitacao atual para tentar outro.
              </Text>
              <Button
                title="Cancelar solicitacao"
                onPress={handleCancelAffiliation}
                isLoading={isCancelling}
                bg="transparent"
                borderWidth="$1"
                borderColor="$brandDanger"
                textColor="$brandDanger"
                $active-bg="$red50"
              />
            </VStack>
          )}

          {gate === "open" && (
          <>
          <Text fontFamily="$body" color="$coolGray500" mt="$2" mb="$4">
            Encontre um estabelecimento e solicite vinculacao.
          </Text>

          <GluestackInput
            h="$12"
            borderWidth="$1"
            borderColor="$forest"
            borderRadius="$md"
            $focus-borderWidth="$2"
            mb="$4"
          >
            <InputField
              placeholder="Nome do estabelecimento"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              color="$coolGray900"
              fontFamily="$body"
              autoCorrect={false}
              returnKeyType="search"
            />
            <InputSlot
              pr="$3"
              onPress={
                search.trim()
                  ? () => { setSearch(""); setResults([]); setHasSearched(false); }
                  : handleSearch
              }
            >
              <InputIcon
                as={search.trim() ? CloseIcon : SearchIcon}
                color={search.trim() ? "$coolGray500" : "$forest"}
              />
            </InputSlot>
          </GluestackInput>

          {isSearching && (
            <VStack mt="$4">
              <SkeletonList count={3} />
            </VStack>
          )}

          {!isSearching && hasSearched && results.length === 0 && (
            <VStack alignItems="center" mt="$8">
              <Text fontFamily="$body" color="$coolGray400">
                Nenhum estabelecimento encontrado.
              </Text>
            </VStack>
          )}

          {results.map((est) => (
            <Pressable
              key={est.id}
              onPress={() => openDetail(est)}
              py="$4"
              px="$4"
              bg="$brandSurface"
              borderRadius="$card"
              mb="$2"
              $active-bg="$coolGray50"
            >
              <HStack justifyContent="space-between" alignItems="center">
                <VStack flex={1}>
                  <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900">
                    {est.name}
                  </Text>
                  <Text fontFamily="$body" fontSize="$xs" color="$coolGray500">
                    {serviceTypeLabel(est.serviceType)}
                  </Text>
                </VStack>
                <HStack alignItems="center" space="sm">
                  <Text
                    fontFamily="$body"
                    fontSize="$xs"
                    color={est.openStatus === "OPEN" ? "$forest" : "$coolGray400"}
                  >
                    {est.openStatus === "OPEN" ? "Aberto" : "Fechado"}
                  </Text>
                  <ChevronRightIcon color="$coolGray400" />
                </HStack>
              </HStack>
            </Pressable>
          ))}
          </>
          )}
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
