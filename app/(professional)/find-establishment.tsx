import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Search, X, ChevronRight } from "lucide-react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwButton } from "@components/nw/Button";
import { SkeletonList } from "@components/Skeleton";
import { api, getApiErrorMessage } from "@lib/api";
import { serviceTypeLabel } from "@lib/serviceTypes";
import { useProfessionalStore } from "@store/professional.store";
import { confirmar } from "@lib/confirmar";

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
      // A busca de AFILIACAO precisa achar TODOS os estabelecimentos, inclusive os
      // CLOSED — loja recem-criada nasce fechada, e um dono novo tem que ser achado.
      // Desde 06/09 (confirmado em producao em 17/09) o GET /establishment ja
      // devolve todas as lojas ativas por padrao, com as abertas primeiro.
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
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível buscar estabelecimentos."));
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

  const handleCancelAffiliation = async () => {
    if (!pendingAffiliationId) return;
    const ok = await confirmar({
      titulo: "Cancelar solicitação",
      mensagem: `Deseja cancelar sua solicitação para ${blockedName ?? "este estabelecimento"}? Você poderá solicitar a outro estabelecimento depois.`,
      confirmar: "Cancelar solicitação",
      destrutivo: true,
    });
    if (!ok) return;

      setIsCancelling(true);
      try {
        await useProfessionalStore.getState().cancelAffiliation(pendingAffiliationId);
        setPendingAffiliationId(null);
        setBlockedName(null);
        setGate("open");
        await loadAll();
      } catch (error: any) {
        Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível cancelar a solicitação."));
      } finally {
        setIsCancelling(false);
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
        <View className="flex-1 pb-12 px-4">
          <ScreenHeader
            title="Buscar estabelecimento"
            onBack={() => router.navigate("/(professional)/queue" as any)}
          />

          {gate === "loading" && (
            <View className="items-center mt-12">
              <ActivityIndicator size="large" color="#163300" />
            </View>
          )}

          {gate === "affiliated" && (
            <View className="bg-vupth-greenTint p-4 rounded-card border border-vupth-forest mt-6">
              <Text className="font-heading text-vupth-forest mb-2">Você já está vinculado</Text>
              <Text className="font-body text-vupth-textSecondary mb-4">
                Você atende em {blockedName ?? "um estabelecimento"}. Um profissional só pode
                trabalhar em um estabelecimento por vez. Para mudar, desafilie-se em Configurações.
              </Text>
              <NwButton
                title="Ir para Configurações"
                onPress={() => router.navigate("/(professional)/settings" as any)}
                className="mt-0"
              />
            </View>
          )}

          {gate === "pending" && (
            <View className="bg-vupth-warning p-4 rounded-card mt-6">
              <Text className="font-heading text-vupth-forest mb-2">Solicitação em andamento</Text>
              <Text className="font-body text-vupth-textSecondary mb-4">
                Você já solicitou vinculação a {blockedName ?? "um estabelecimento"} e esta
                aguardando a resposta do proprietário. Só e possível solicitar a um estabelecimento
                por vez — aguarde o retorno ou cancele a solicitação atual para tentar outro.
              </Text>
              <NwButton
                title="Cancelar solicitação"
                onPress={handleCancelAffiliation}
                isLoading={isCancelling}
                variant="outlineDanger"
                className="mt-0"
              />
            </View>
          )}

          {gate === "open" && (
            <>
              <Text className="font-body text-vupth-textSecondary mt-2 mb-4">
                Encontre um estabelecimento e solicite vinculação.
              </Text>

              {/* O ícone da direita TROCA de papel: limpa quando há texto, busca
                  quando está vazio. */}
              <View className="flex-row items-center h-12 mb-4 px-3 rounded-md border border-vupth-forest bg-white">
                <TextInput
                  className="flex-1 font-body text-vupth-forest"
                  placeholder="Nome do estabelecimento"
                  placeholderTextColor="#6B706B"
                  value={search}
                  onChangeText={setSearch}
                  onSubmitEditing={handleSearch}
                  autoCorrect={false}
                  returnKeyType="search"
                />
                <Pressable
                  onPress={
                    search.trim()
                      ? () => {
                          setSearch("");
                          setResults([]);
                          setHasSearched(false);
                        }
                      : handleSearch
                  }
                  accessibilityRole="button"
                  accessibilityLabel={search.trim() ? "Limpar busca" : "Buscar"}
                  className="pl-3"
                >
                  {search.trim() ? (
                    <X size={18} color="#454745" />
                  ) : (
                    <Search size={18} color="#163300" />
                  )}
                </Pressable>
              </View>

              {isSearching && (
                <View className="mt-4">
                  <SkeletonList count={3} />
                </View>
              )}

              {!isSearching && hasSearched && results.length === 0 && (
                <View className="items-center mt-8">
                  <Text className="font-body text-vupth-textSecondary">
                    Nenhum estabelecimento encontrado.
                  </Text>
                </View>
              )}

              {results.map((est) => (
                <Pressable
                  key={est.id}
                  onPress={() => openDetail(est)}
                  className="py-4 px-4 bg-vupth-surface rounded-card mb-2"
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="font-heading text-vupth-forest">{est.name}</Text>
                      <Text className="font-body text-xs text-vupth-textSecondary">
                        {serviceTypeLabel(est.serviceType)}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text
                        className={`font-body text-xs ${
                          est.openStatus === "OPEN"
                            ? "text-vupth-forest"
                            : "text-vupth-textSecondary"
                        }`}
                      >
                        {est.openStatus === "OPEN" ? "Aberto" : "Fechado"}
                      </Text>
                      <ChevronRight size={16} color="#454745" />
                    </View>
                  </View>
                </Pressable>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
