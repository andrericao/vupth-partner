import { useState, useEffect, useCallback } from "react";
import {
  VStack,
  HStack,
  Heading,
  Text,
  ScrollView,
  Input as GluestackInput,
  InputField,
  InputSlot,
  InputIcon,
  SearchIcon,
  CloseIcon,
} from "@gluestack-ui/themed";
import { SkeletonList } from "@components/Skeleton";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { cardShadow } from "@lib/styles";
import { Button } from "@components/Button";
import {
  useEstablishmentStore,
  type ProfessionalSearchResult,
} from "@store/establishment.store";
import { getApiErrorMessage } from "@lib/api";

export default function InviteProfessionalScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const searchProfessionals = useEstablishmentStore((s) => s.searchProfessionals);
  const inviteProfessional = useEstablishmentStore((s) => s.inviteProfessional);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProfessionalSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const runSearch = useCallback(
    async (term: string) => {
      setIsSearching(true);
      try {
        setResults(await searchProfessionals(term));
      } catch (error: any) {
        Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel buscar profissionais."));
      } finally {
        setIsSearching(false);
      }
    },
    [searchProfessionals]
  );

  useEffect(() => {
    // busca inicial (query vazia = todos); sinaliza isSearching.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runSearch("");
  }, [runSearch]);

  const handleInvite = async (p: ProfessionalSearchResult) => {
    if (!establishment?.id) return;
    setInvitingId(p.id);
    try {
      await inviteProfessional(establishment.id, p.id);
      setInvitedIds((prev) => [...prev, p.id]);
      Alert.alert("Convite enviado", `${p.name ?? "Profissional"} recebera a solicitacao de vinculacao.`);
    } catch (error: any) {
      const code = error?.response?.data?.code;
      // Mensagem no contexto do OWNER (o map padrao fala "voce ja esta vinculado").
      const message =
        code === "PROFESSIONAL_ALREADY_AFFILIATED"
          ? `${p.name ?? "Esse profissional"} ja esta vinculado a um estabelecimento.`
          : code === "AFFILIATION_ALREADY_PENDING"
          ? `Ja existe uma solicitacao pendente com ${p.name ?? "esse profissional"}.`
          : getApiErrorMessage(error, "Nao foi possivel enviar o convite.");
      Alert.alert("Nao foi possivel convidar", message);
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        w="$full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <VStack flex={1} py="$12" px="$6">
          <Header showBackButton onBack={() => router.navigate("/(owner)/menu" as any)} />

          <Heading mt="$8" size="2xl" fontFamily="$heading">
            Convidar Profissional
          </Heading>
          <Text fontFamily="$body" color="$coolGray500" mt="$1" mb="$4">
            Busque pelo nome e envie o convite. O profissional precisa aceitar para
            ser vinculado.
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
              placeholder="Nome do profissional"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => runSearch(search)}
              color="$coolGray900"
              fontFamily="$body"
              autoCorrect={false}
              returnKeyType="search"
            />
            <InputSlot
              pr="$3"
              onPress={
                search.trim()
                  ? () => { setSearch(""); runSearch(""); }
                  : () => runSearch(search)
              }
            >
              <InputIcon
                as={search.trim() ? CloseIcon : SearchIcon}
                color={search.trim() ? "$coolGray500" : "$green600"}
              />
            </InputSlot>
          </GluestackInput>

          {isSearching && (
            <VStack mt="$4">
              <SkeletonList count={3} />
            </VStack>
          )}

          {!isSearching && results.length === 0 && (
            <Text fontFamily="$body" color="$coolGray400" textAlign="center" mt="$8">
              Nenhum profissional encontrado
            </Text>
          )}

          <VStack space="sm">
            {results.map((p) => {
              const invited = invitedIds.includes(p.id);
              return (
                <HStack
                  key={p.id}
                  bg="$white"
                  p="$3"
                  borderRadius="$2xl"
                  style={cardShadow}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <VStack flex={1}>
                    <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900">
                      {p.name ?? "Profissional"}
                      {p.nickname ? ` (${p.nickname})` : ""}
                    </Text>
                    <Text fontFamily="$body" fontSize="$xs" color="$coolGray500">
                      {p.specialty ?? "Sem especialidade"}
                    </Text>
                  </VStack>
                  {invited ? (
                    <Text fontFamily="$body" fontSize="$sm" color="$green700">
                      Convite enviado
                    </Text>
                  ) : (
                    <Button
                      title="Convidar"
                      onPress={() => handleInvite(p)}
                      isLoading={invitingId === p.id}
                      bg="$green500"
                      $active-bg="$green600"
                      h="$9"
                    />
                  )}
                </HStack>
              );
            })}
          </VStack>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
