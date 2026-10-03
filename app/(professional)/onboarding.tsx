import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { CampoDeBusca } from "@components/nw/CampoDeBusca";
import { OnboardingPathChoice } from "@components/OnboardingPathChoice";
import { useProfessionalStore } from "@store/professional.store";
import { useEstablishmentStore, EstablishmentSearchResult } from "@store/establishment.store";
import { useAuthStore } from "@store/auth.store";
import { getApiErrorMessage } from "@lib/api";
import { avisar } from "@lib/confirmar";

const SPECIALTIES = [
  { label: "Barbeiro", value: "BARBER" },
  { label: "Cabeleireiro(a)", value: "HAIRDRESSER" },
  { label: "Manicure", value: "NAIL_TECH" },
  { label: "Designer de sobrancelha", value: "EYEBROW_TECH" },
  { label: "Massagista", value: "MASSEUSE" },
  { label: "Esteticista", value: "ESTHETICIAN" },
] as const;

type Step = "profile" | "path" | "search" | "confirm";

export default function ProfessionalOnboardingScreen() {
  const [step, setStep] = useState<Step>("profile");

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EstablishmentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [listaFalhou, setListaFalhou] = useState(false);
  const [selectedEstablishment, setSelectedEstablishment] = useState<EstablishmentSearchResult | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  // So p/ engrossar a borda do campo de busca no foco (o v1 fazia via
  // $focus-borderWidth do gluestack).

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

      setStep("path");
    } catch (error: any) {
      const code = error?.response?.data?.code;
      if (code === "USER_ALREADY_PROFESSIONAL") {
        setStep("path");
      } else if (code === "VALIDATION_ERROR") {
        const fieldErrors = error.response.data.fieldErrors;
        const msg = Object.values(fieldErrors).join("\n");
        Alert.alert("Erro de validacao", msg);
      } else {
        Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível criar o perfil. Tente novamente."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // `automatica`: a carga ao entrar no passo. Se ela falha, o aviso fica na
  // tela, sem a caixa de erro: a caixa abria por cima do campo enquanto a
  // pessoa digitava e engolia o texto (bateria do Andre, 03/10, 02.13).
  const handleSearch = async (automatica = false) => {
    setIsSearching(true);
    setListaFalhou(false);
    try {
      const results = await searchByName(automatica ? "" : searchQuery.trim());
      setSearchResults(results);
    } catch (error: any) {
      setSearchResults([]);
      if (automatica) setListaFalhou(true);
      else Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível buscar estabelecimentos."));
    } finally {
      setIsSearching(false);
    }
  };

  // Ao entrar no passo de busca, ja carrega a lista (query vazia = todos), pra
  // o profissional ver os estabelecimentos sem precisar tocar em "Buscar".
  useEffect(() => {
    // busca automatica ao entrar no passo; handleSearch sinaliza isSearching.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (step === "search") handleSearch(true);
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
      // A solicitacao JA FOI enviada — sem a caixa na web o profissional
      // ficava na mesma tela e enviava de novo.
      await avisar({
        titulo: "Solicitação enviada",
        mensagem: `Sua solicitação para ${selectedEstablishment.name} foi enviada. Aguarde a aprovação do proprietário.`,
      });
      router.replace("/(professional)/queue" as any);
    } catch (error: any) {
      const code = error?.response?.data?.code;
      if (code === "PROFESSIONAL_ALREADY_AFFILIATED") {
        Alert.alert("Aviso", "Você já está vinculado a um estabelecimento.");
      } else if (code === "AFFILIATION_ALREADY_REQUESTED") {
        Alert.alert("Aviso", "Você já solicitou vinculação a este estabelecimento. Aguarde a aprovação.");
      } else {
        Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível enviar a solicitação. Tente novamente."));
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
        <View className="flex-1 pb-12 px-4">
          <ScreenHeader
            title="Cadastro profissional"
            onBack={() => router.navigate("/(professional)/queue" as any)}
          />

          <View className="flex-1 w-full">

            <NwInput
              label="Seu nome"
              placeholder="Joao Silva"
              value={name}
              onChangeText={setName}
              testID="professional-name"
              error={isInvalid ? "Nome obrigatório" : ""}
            />

            <View className="mb-3 w-full">
              <Text className="font-body text-vupth-textSecondary mb-1">
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
                        isSelected ? "bg-vupth-forest border-vupth-forest" : "bg-vupth-surface border-vupth-border"
                      }`}
                    >
                      <Text
                        className={`font-body text-center ${
                          isSelected ? "text-white" : "text-vupth-textSecondary"
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

  // S23 — a pergunta que nao existia. Antes daqui o fluxo caia direto na busca,
  // e quem tem loja propria procurava uma loja que ainda nao existe.
  if (step === "path") {
    return (
      <ScrollView
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 pb-12 px-4">
          <ScreenHeader title="Onde você vai atender?" onBack={() => setStep("profile")} />

          <View className="flex-1">
            <Text className="font-body text-vupth-textSecondary mb-6">
              Perfil criado. Agora diga como você vai trabalhar — dá para mudar depois.
            </Text>

            <OnboardingPathChoice
              onOwnShop={() => router.push("/(owner)/onboarding/establishment" as any)}
              onExistingShop={() => setStep("search")}
            />
          </View>
        </View>
      </ScrollView>
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
        <View className="flex-1 pb-12 px-4">
          <ScreenHeader title="Buscar estabelecimento" onBack={() => setStep("path")} />

          <View className="flex-1">

            <Text className="font-body text-vupth-textSecondary mb-6">
              Busque o estabelecimento onde você vai trabalhar.
            </Text>

            <CampoDeBusca
              value={searchQuery}
              placeholder="Nome do estabelecimento"
              onChangeText={setSearchQuery}
              onBuscar={() => handleSearch()}
              onLimpar={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              testID="search-establishment"
            />

            {isSearching && <ActivityIndicator size="large" color="#163300" />}

            {searchResults.length > 0 && (
              <View className="mt-2 gap-2">
                {searchResults.map((estab) => (
                  <Pressable
                    key={estab.id}
                    accessibilityRole="button"
                    testID="establishment-card"
                    onPress={() => handleSelectEstablishment(estab)}
                    className="bg-vupth-surface py-3 px-4 rounded-card"
                  >
                    <Text className="font-heading text-vupth-forest">{estab.name}</Text>
                    <View className="flex-row gap-2 mt-1">
                      <Text className="font-body text-sm text-vupth-textSecondary">
                        {estab.services?.join(", ")}
                      </Text>
                      <Text
                        className={`font-body text-sm ${
                          estab.open_status === "OPEN" ? "text-vupth-forest" : "text-vupth-textSecondary"
                        }`}
                      >
                        {estab.open_status === "OPEN" ? "ABERTO" : "FECHADO"}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {!isSearching && listaFalhou && (
              <Text testID="lista-falhou" className="font-body text-vupth-textSecondary text-center mt-6">
                Não foi possível carregar a lista. Busque pelo nome.
              </Text>
            )}

            {!isSearching && !listaFalhou && searchResults.length === 0 && searchQuery.length > 0 && (
              <Text className="font-body text-vupth-textSecondary text-center mt-6">
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
      <View className="flex-1 pb-12 px-4 items-center justify-center">
        <ScreenHeader
          title="Confirmar vinculação"
        />

        {selectedEstablishment && (
          <View className="bg-vupth-surface p-6 rounded-card w-full mb-6">
            <Text className="font-heading text-xl text-vupth-forest">
              {selectedEstablishment.name}
            </Text>
            <Text className="font-body text-vupth-textSecondary mt-1">
              {selectedEstablishment.services?.join(", ")}
            </Text>
            <Text
              className={`font-body mt-1 ${
                selectedEstablishment.open_status === "OPEN" ? "text-vupth-forest" : "text-vupth-textSecondary"
              }`}
            >
              {selectedEstablishment.open_status === "OPEN" ? "ABERTO" : "FECHADO"}
            </Text>
          </View>
        )}

        <NwButton
          title="Solicitar vinculação"
          onPress={handleAffiliate}
          isLoading={isLoading}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => setStep("search")}
          className="mt-4"
        >
          <Text className="font-body text-center text-vupth-forest">
            Voltar e escolher outro
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
