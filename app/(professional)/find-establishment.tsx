import { useState, useEffect } from "react";
import {
  VStack,
  HStack,
  Heading,
  Text,
  Pressable,
  ScrollView,
  Spinner,
  Input as GluestackInput,
  InputField,
  InputSlot,
} from "@gluestack-ui/themed";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { Button } from "@components/Button";
import { api, getApiErrorMessage } from "@lib/api";
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
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [gate, setGate] = useState<Gate>("loading");
  const [blockedName, setBlockedName] = useState<string | null>(null);
  const [pendingAffiliationId, setPendingAffiliationId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadAll = async () => {
    setIsSearching(true);
    try {
      const { data } = await api.get("/establishment");
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
        params: { name: search.trim() },
      });
      setResults(data);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel buscar estabelecimentos."));
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestAffiliation = async (establishment: EstablishmentResult) => {
    setIsRequesting(true);
    try {
      await api.post("/professional/me/affiliations", {
        establishmentId: establishment.id,
      });
      Alert.alert(
        "Solicitacao enviada",
        `Sua solicitacao para ${establishment.name} foi enviada. Aguarde a aprovacao do proprietario.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel enviar a solicitacao."));
    } finally {
      setIsRequesting(false);
    }
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
        <VStack flex={1} py="$12" px="$6">
          <Header showBackButton onBack={() => router.navigate("/(professional)/profile" as any)} />

          <Heading mt="$8" size="2xl" fontFamily="$heading">
            Buscar Estabelecimento
          </Heading>

          {gate === "loading" && (
            <VStack alignItems="center" mt="$12">
              <Spinner color="$green500" size="large" />
            </VStack>
          )}

          {gate === "affiliated" && (
            <VStack
              bg="$green50"
              p="$4"
              borderRadius="$lg"
              borderWidth="$1"
              borderColor="$green200"
              mt="$6"
            >
              <Text fontFamily="$heading" fontWeight="$bold" color="$green700" mb="$2">
                Voce ja esta vinculado
              </Text>
              <Text fontFamily="$body" color="$coolGray600" mb="$4">
                Voce atende em {blockedName ?? "um estabelecimento"}. Um
                profissional so pode trabalhar em um estabelecimento por vez.
                Para mudar, desafilie-se em Configuracoes.
              </Text>
              <Button
                title="Ir para Configuracoes"
                onPress={() => router.navigate("/(professional)/settings" as any)}
                bg="$green500"
                $active-bg="$green600"
              />
            </VStack>
          )}

          {gate === "pending" && (
            <VStack
              bg="$amber50"
              p="$4"
              borderRadius="$lg"
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
                borderColor="$red500"
                textColor="$red500"
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
            borderColor="$green500"
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
              onPress={search.trim() ? () => { setSearch(""); setResults([]); setHasSearched(false); } : handleSearch}
            >
              <Text fontSize="$lg" color={search.trim() ? "$red500" : "$coolGray400"}>
                {search.trim() ? "✕" : "🔍"}
              </Text>
            </InputSlot>
          </GluestackInput>

          {isSearching && (
            <VStack alignItems="center" mt="$8">
              <Spinner color="$green500" size="large" />
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
              onPress={() => handleRequestAffiliation(est)}
              disabled={isRequesting}
              py="$4"
              px="$4"
              bg="$white"
              borderRadius="$md"
              borderWidth="$1"
              borderColor="$coolGray200"
              mb="$2"
              $active-bg="$coolGray50"
            >
              <HStack justifyContent="space-between" alignItems="center">
                <VStack flex={1}>
                  <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900">
                    {est.name}
                  </Text>
                  <Text fontFamily="$body" fontSize="$xs" color="$coolGray500">
                    {est.serviceType}
                  </Text>
                </VStack>
                <Text
                  fontFamily="$body"
                  fontSize="$xs"
                  color={est.openStatus === "OPEN" ? "$green600" : "$coolGray400"}
                >
                  {est.openStatus === "OPEN" ? "Aberto" : "Fechado"}
                </Text>
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
