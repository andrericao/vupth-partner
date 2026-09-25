import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { CampoDeBusca } from "@components/nw/CampoDeBusca";
import { SkeletonList } from "@components/Skeleton";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwButton } from "@components/nw/Button";
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
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 pb-12 px-4">
          <ScreenHeader
            title="Convidar profissional"
            subtitle="Busque pelo nome e envie o convite. O profissional precisa aceitar."
            onBack={() => router.navigate("/(owner)/menu" as any)}
          />

          <CampoDeBusca
            value={search}
            placeholder="Nome do profissional"
            onChangeText={setSearch}
            onBuscar={() => runSearch(search)}
            onLimpar={() => {
              setSearch("");
              runSearch("");
            }}
          />

          {isSearching && (
            <View className="mt-4">
              <SkeletonList count={3} />
            </View>
          )}

          {!isSearching && results.length === 0 && (
            <Text className="font-body text-vupth-textSecondary text-center mt-8">
              Nenhum profissional encontrado
            </Text>
          )}

          <View className="gap-2">
            {results.map((p) => {
              const invited = invitedIds.includes(p.id);
              return (
                <View
                  key={p.id}
                  className="flex-row items-center justify-between bg-vupth-surface p-3 rounded-card"
                >
                  <View className="flex-1">
                    <Text className="font-heading text-vupth-forest">
                      {p.name ?? "Profissional"}
                      {p.nickname ? ` (${p.nickname})` : ""}
                    </Text>
                    <Text className="font-body text-xs text-vupth-textSecondary">
                      {p.specialty ?? "Sem especialidade"}
                    </Text>
                  </View>
                  {invited ? (
                    <Text className="font-body text-sm text-vupth-forest">Convite enviado</Text>
                  ) : (
                    <NwButton
                      title="Convidar"
                      onPress={() => handleInvite(p)}
                      isLoading={invitingId === p.id}
                      className="h-9 px-4 mt-0"
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
