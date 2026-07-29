import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { cardShadow } from "@lib/styles";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { useProfessionalStore } from "@store/professional.store";
import { useEstablishmentStore, EstablishmentSearchResult } from "@store/establishment.store";
import { useAuthStore } from "@store/auth.store";
import { getApiErrorMessage } from "@lib/api";

const SPECIALTIES = [
  { label: "Barbeiro", value: "BARBER" },
  { label: "Cabeleireiro(a)", value: "HAIRDRESSER" },
  { label: "Manicure", value: "NAIL_TECH" },
  { label: "Designer de sobrancelha", value: "EYEBROW_TECH" },
  { label: "Massagista", value: "MASSEUSE" },
  { label: "Esteticista", value: "ESTHETICIAN" },
] as const;

type Step = "profile" | "search" | "confirm";

export default function ProfessionalOnboardingScreen() {
  const [step, setStep] = useState<Step>("profile");

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EstablishmentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEstablishment, setSelectedEstablishment] = useState<EstablishmentSearchResult | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  // So p/ engrossar a borda do campo de busca no foco (o v1 fazia via
  // $focus-borderWidth do gluestack).
  const [searchFocused, setSearchFocused] = useState(false);

  const registerProfessional = useProfessionalStore((s) => s.register);
  const requestAffiliation = useProfessionalStore((s) => s.requestAffiliation);
  const searchByName = useEstablishmentStore((s) => s.searchByName);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const handleRegister = async () => {
    if (!name.trim()) {
      setIsInvalid(true);
      return;
    }

    setIsInvalid(false);
    setIsLoading(true);

    try {
      await registerProfessional(name.trim(), specialty || undefined);

      try {
        await refreshToken();
      } catch {}

      setStep("search");
    } catch (error: any) {
      const code = error?.response?.data?.code;
      if (code === "USER_ALREADY_PROFESSIONAL") {
        setStep("search");
      } else if (code === "VALIDATION_ERROR") {
        const fieldErrors = error.response.data.fieldErrors;
        const msg = Object.values(fieldErrors).join("\n");
        Alert.alert("Erro de validacao", msg);
      } else {
        Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel criar o perfil. Tente novamente."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const results = await searchByName(searchQuery.trim());
      setSearchResults(results);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel buscar estabelecimentos."));
    } finally {
      setIsSearching(false);
    }
  };

  // Ao entrar no passo de busca, ja carrega a lista (query vazia = todos), pra
  // o profissional ver os estabelecimentos sem precisar tocar em "Buscar".
  useEffect(() => {
    // busca automatica ao entrar no passo; handleSearch sinaliza isSearching.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (step === "search") handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleSelectEstablishment = (establishment: EstablishmentSearchResult) => {
    setSelectedEstablishment(establishment);
    setStep("confirm");
  };

  const handleAffiliate = async () => {
    if (!selectedEstablishment) return;

    setIsLoading(true);
    try {
      await requestAffiliation(selectedEstablishment.id);
      Alert.alert(
        "Solicitacao enviada",
        `Sua solicitacao para ${selectedEstablishment.name} foi enviada. Aguarde a aprovacao do proprietario.`,
        [{ text: "OK", onPress: () => router.replace("/(professional)/queue" as any) }]
      );
    } catch (error: any) {
      const code = error?.response?.data?.code;
      if (code === "PROFESSIONAL_ALREADY_AFFILIATED") {
        Alert.alert("Aviso", "Voce ja esta vinculado a um estabelecimento.");
      } else if (code === "AFFILIATION_ALREADY_REQUESTED") {
        Alert.alert("Aviso", "Voce ja solicitou vinculacao a este estabelecimento. Aguarde a aprovacao.");
      } else {
        Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel enviar a solicitacao. Tente novamente."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "profile") {
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
        <View className="flex-1 py-12 px-6 items-center justify-center">
          <Header showBackButton onBack={() => router.navigate("/(professional)/queue" as any)} />

          <View className="flex-1 mt-48 w-full">
            <Text className="font-heading text-3xl mb-8 text-gray-900">
              Cadastro Profissional
            </Text>

            <NwInput
              label="Seu nome"
              placeholder="Joao Silva"
              value={name}
              onChangeText={setName}
              testID="professional-name"
              error={isInvalid ? "Nome obrigatorio" : ""}
            />

            <View className="mb-3 w-full">
              <Text className="font-body text-gray-600 mb-1">
                Especialidade (opcional)
              </Text>
              <View className="gap-1">
                {SPECIALTIES.map((s) => {
                  const isSelected = specialty === s.value;
                  return (
                    <Pressable
                      key={s.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => setSpecialty(isSelected ? "" : s.value)}
                      className={`py-2.5 px-4 rounded-md border ${
                        isSelected ? "bg-brand border-brand-600" : "bg-gray-100 border-gray-200"
                      }`}
                    >
                      <Text
                        className={`font-body text-center ${
                          isSelected ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {s.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <NwButton
              title="Continuar"
              onPress={handleRegister}
              isLoading={isLoading}
            />
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (step === "search") {
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
        <View className="flex-1 py-12 px-6">
          <Header showBackButton onBack={() => setStep("profile")} />

          <View className="flex-1 mt-12">
            <Text className="font-heading text-2xl mb-4 text-gray-900">
              Buscar Estabelecimento
            </Text>

            <Text className="font-body text-gray-600 mb-6">
              Busque o estabelecimento onde voce vai trabalhar.
            </Text>

            <View
              className={`flex-row items-center h-12 rounded-md mb-4 pr-3 ${
                searchFocused ? "border-2 border-brand" : "border border-brand"
              }`}
            >
              <TextInput
                className="flex-1 px-3 font-body text-gray-900"
                placeholder="Nome do estabelecimento"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                autoCorrect={false}
                returnKeyType="search"
                testID="search-establishment"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={searchQuery.trim() ? "Limpar busca" : "Buscar"}
                hitSlop={8}
                onPress={
                  searchQuery.trim()
                    ? () => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }
                    : handleSearch
                }
              >
                <Ionicons
                  name={searchQuery.trim() ? "close" : "search"}
                  size={18}
                  color={searchQuery.trim() ? "#6b7280" : "#316635"}
                />
              </Pressable>
            </View>

            {isSearching && <ActivityIndicator size="large" color="#3b7a3f" />}

            {searchResults.length > 0 && (
              <View className="mt-2 gap-2">
                {searchResults.map((estab) => (
                  <Pressable
                    key={estab.id}
                    accessibilityRole="button"
                    testID="establishment-card"
                    onPress={() => handleSelectEstablishment(estab)}
                    className="bg-white py-3 px-4 rounded-2xl"
                    style={cardShadow}
                  >
                    <Text className="font-heading text-gray-900">{estab.name}</Text>
                    <View className="flex-row gap-2 mt-1">
                      <Text className="font-body text-sm text-gray-500">
                        {estab.services?.join(", ")}
                      </Text>
                      <Text
                        className={`font-body text-sm ${
                          estab.open_status === "OPEN" ? "text-brand" : "text-gray-400"
                        }`}
                      >
                        {estab.open_status === "OPEN" ? "ABERTO" : "FECHADO"}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {!isSearching && searchResults.length === 0 && searchQuery.length > 0 && (
              <Text className="font-body text-gray-400 text-center mt-6">
                Nenhum estabelecimento encontrado.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView
      className="w-full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 py-12 px-6 items-center justify-center">
        <Header />

        <Text className="font-heading text-2xl mt-12 mb-8 text-gray-900">
          Confirmar Vinculacao
        </Text>

        {selectedEstablishment && (
          <View className="bg-white p-6 rounded-2xl w-full mb-6" style={cardShadow}>
            <Text className="font-heading text-xl text-gray-900">
              {selectedEstablishment.name}
            </Text>
            <Text className="font-body text-gray-500 mt-1">
              {selectedEstablishment.services?.join(", ")}
            </Text>
            <Text
              className={`font-body mt-1 ${
                selectedEstablishment.open_status === "OPEN" ? "text-brand" : "text-gray-400"
              }`}
            >
              {selectedEstablishment.open_status === "OPEN" ? "ABERTO" : "FECHADO"}
            </Text>
          </View>
        )}

        <NwButton
          title="Solicitar Vinculacao"
          onPress={handleAffiliate}
          isLoading={isLoading}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => setStep("search")}
          className="mt-4"
        >
          <Text className="font-body text-center text-brand-600">
            Voltar e escolher outro
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
