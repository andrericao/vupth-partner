import { useState } from "react";
import {
  VStack,
  HStack,
  Heading,
  Text,
  Pressable,
  ScrollView,
  Spinner,
} from "@gluestack-ui/themed";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { Button } from "@components/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { useProfessionalStore } from "@store/professional.store";
import { api } from "@lib/api";

type EstablishmentResult = {
  id: string;
  name: string;
  serviceType: string;
  openStatus: string;
};

export default function FindEstablishmentScreen() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<EstablishmentResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const professional = useProfessionalStore((s) => s.professional);
  const myServices = useProfessionalStore((s) => s.myServices);

  const handleSearch = async () => {
    if (!search.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const { data } = await api.get("/establishment", {
        params: { name: search.trim() },
      });
      setResults(data);
    } catch {
      Alert.alert("Erro", "Nao foi possivel buscar estabelecimentos.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestAffiliation = async (establishment: EstablishmentResult) => {
    if (!myServices || myServices.length === 0) {
      Alert.alert(
        "Adicione servicos primeiro",
        "Voce precisa ter pelo menos um servico cadastrado para solicitar afiliacao.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Adicionar servicos",
            onPress: () => router.push("/(professional)/my-services" as any),
          },
        ]
      );
      return;
    }

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
      const msg =
        error?.response?.data?.message ??
        "Nao foi possivel enviar a solicitacao.";
      Alert.alert("Erro", msg);
    } finally {
      setIsRequesting(false);
    }
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
          <Header showBackButton />

          <Heading mt="$8" size="2xl" fontFamily="$heading">
            Buscar Estabelecimento
          </Heading>

          <Text fontFamily="$body" color="$coolGray500" mt="$2" mb="$4">
            Encontre um estabelecimento e solicite vinculacao.
          </Text>

          <HStack space="sm" mb="$4">
            <VStack flex={1}>
              <Input
                textLabel=""
                placeholder="Nome do estabelecimento"
                messageError=""
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={handleSearch}
              />
            </VStack>
            <Button
              title="Buscar"
              onPress={handleSearch}
              isLoading={isSearching}
              bg="$green500"
              $active-bg="$green600"
              w="$24"
              h="$12"
            />
          </HStack>

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
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
