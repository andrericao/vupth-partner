import { useState, useEffect, useCallback } from "react";
import {
  VStack,
  HStack,
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
import { ScreenHeader } from "@components/ScreenHeader";
import { BrandButton } from "@components/brand/Button";
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
        Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível buscar profissionais."));
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
      Alert.alert("Convite enviado", `${p.name ?? "Profissional"} receberá a solicitação de vinculação.`);
    } catch (error: any) {
      const code = error?.response?.data?.code;
      // Mensagem no contexto do OWNER (o map padrao fala "voce ja esta vinculado").
      const message =
        code === "PROFESSIONAL_ALREADY_AFFILIATED"
          ? `${p.name ?? "Esse profissional"} já está vinculado a um estabelecimento.`
          : code === "AFFILIATION_ALREADY_PENDING"
          ? `Já existe uma solicitação pendente com ${p.name ?? "esse profissional"}.`
          : getApiErrorMessage(error, "Não foi possível enviar o convite.");
      Alert.alert("Não foi possível convidar", message);
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
        <VStack flex={1} pb="$12" px="$4">
          <ScreenHeader
            title="Convidar profissional"
            subtitle="Busque pelo nome e envie o convite. O profissional precisa aceitar."
            onBack={() => router.navigate("/(owner)/menu" as any)}
          />

          <GluestackInput
            h="$12"
            borderWidth="$1"
            borderColor="$forest"
            borderRadius="$md"
            $focus-borderWidth="$2"
            mb="$4"
          >
            <InputField
              placeholder="Nome do profissional"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => runSearch(search)}
              color="$forest"
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
                color={search.trim() ? "$brandTextSecondary" : "$forest"}
              />
            </InputSlot>
          </GluestackInput>

          {isSearching && (
            <VStack mt="$4">
              <SkeletonList count={3} />
            </VStack>
          )}

          {!isSearching && results.length === 0 && (
            <Text fontFamily="$body" color="$brandTextSecondary" textAlign="center" mt="$8">
              Nenhum profissional encontrado
            </Text>
          )}

          <VStack space="sm">
            {results.map((p) => {
              const invited = invitedIds.includes(p.id);
              return (
                <HStack
                  key={p.id}
                  bg="$brandSurface"
                  p="$3"
                  borderRadius="$card"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <VStack flex={1}>
                    <Text fontFamily="$heading" fontWeight="$bold" color="$forest">
                      {p.name ?? "Profissional"}
                      {p.nickname ? ` (${p.nickname})` : ""}
                    </Text>
                    <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary">
                      {p.specialty ?? "Sem especialidade"}
                    </Text>
                  </VStack>
                  {invited ? (
                    <Text fontFamily="$body" fontSize="$sm" color="$forest">
                      Convite enviado
                    </Text>
                  ) : (
                    <BrandButton
                      title="Convidar"
                      onPress={() => handleInvite(p)}
                      isLoading={invitingId === p.id}
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
