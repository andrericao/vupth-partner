import { useState } from "react";
import {
  VStack,
  FormControl,
  Heading,
  ScrollView,
  Text,
  Pressable,
  HStack,
  Spinner,
  Input as GluestackInput,
  InputField,
  InputSlot,
} from "@gluestack-ui/themed";
import { router } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { Button } from "@components/Button";
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
        w="$full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <VStack flex={1} py="$12" px="$6" alignItems="center" justifyContent="center">
          <Header showBackButton onBack={() => router.navigate("/(professional)/profile" as any)} />

          <FormControl flex={1} mt="$48" isInvalid={isInvalid}>
            <Heading mb="$8" size="3xl" fontFamily="$heading">
              Cadastro Profissional
            </Heading>

            <Input
              textLabel="Seu nome"
              placeholder="Joao Silva"
              messageError="Nome obrigatorio"
              value={name}
              onChangeText={setName}
              testID="professional-name"
            />

            <VStack mb="$3" w="$full">
              <Text fontFamily="$body" mb="$1" color="$coolGray600">
                Especialidade (opcional)
              </Text>
              <VStack space="xs">
                {SPECIALTIES.map((s) => {
                  const isSelected = specialty === s.value;
                  return (
                    <Pressable
                      key={s.value}
                      onPress={() => setSpecialty(isSelected ? "" : s.value)}
                      bg={isSelected ? "$green500" : "$coolGray100"}
                      py="$2.5"
                      px="$4"
                      borderRadius="$md"
                      borderWidth="$1"
                      borderColor={isSelected ? "$green600" : "$coolGray200"}
                    >
                      <Text
                        fontFamily="$body"
                        color={isSelected ? "$white" : "$coolGray700"}
                        textAlign="center"
                      >
                        {s.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </VStack>
            </VStack>

            <Button
              title="Continuar"
              onPress={handleRegister}
              isLoading={isLoading}
            />
          </FormControl>
        </VStack>
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
        w="$full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <VStack flex={1} py="$12" px="$6">
          <Header showBackButton onBack={() => setStep("profile")} />

          <FormControl flex={1} mt="$12">
            <Heading mb="$4" size="2xl" fontFamily="$heading">
              Buscar Estabelecimento
            </Heading>

            <Text fontFamily="$body" mb="$6" color="$coolGray600">
              Busque o estabelecimento onde voce vai trabalhar.
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
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                color="$coolGray900"
                fontFamily="$body"
                autoCorrect={false}
                returnKeyType="search"
                testID="search-establishment"
              />
              <InputSlot
                pr="$3"
                onPress={searchQuery.trim() ? () => { setSearchQuery(""); setSearchResults([]); } : handleSearch}
              >
                <Text fontSize="$lg" color={searchQuery.trim() ? "$red500" : "$coolGray400"}>
                  {searchQuery.trim() ? "✕" : "🔍"}
                </Text>
              </InputSlot>
            </GluestackInput>

          {isSearching && <Spinner color="$green500" size="large" />}

          {searchResults.length > 0 && (
            <VStack space="sm" mt="$2">
              {searchResults.map((estab) => (
                <Pressable
                  key={estab.id}
                  testID="establishment-card"
                  onPress={() => handleSelectEstablishment(estab)}
                  bg="$white"
                  py="$3"
                  px="$4"
                  borderRadius="$md"
                  borderWidth="$1"
                  borderColor="$coolGray200"
                >
                  <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900">
                    {estab.name}
                  </Text>
                  <HStack space="sm" mt="$1">
                    <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
                      {estab.services?.join(", ")}
                    </Text>
                    <Text
                      fontFamily="$body"
                      fontSize="$sm"
                      color={estab.open_status === "OPEN" ? "$green500" : "$coolGray400"}
                    >
                      {estab.open_status === "OPEN" ? "ABERTO" : "FECHADO"}
                    </Text>
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          )}

          {!isSearching && searchResults.length === 0 && searchQuery.length > 0 && (
            <Text fontFamily="$body" color="$coolGray400" textAlign="center" mt="$6">
              Nenhum estabelecimento encontrado.
            </Text>
          )}
          </FormControl>
        </VStack>
      </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack flex={1} py="$12" px="$6" alignItems="center" justifyContent="center">
        <Header />

        <Heading mt="$12" mb="$8" size="2xl" fontFamily="$heading">
          Confirmar Vinculacao
        </Heading>

        {selectedEstablishment && (
          <VStack
            bg="$white"
            p="$6"
            borderRadius="$lg"
            borderWidth="$1"
            borderColor="$coolGray200"
            w="$full"
            mb="$6"
          >
            <Text fontFamily="$heading" fontSize="$xl" fontWeight="$bold" color="$coolGray900">
              {selectedEstablishment.name}
            </Text>
            <Text fontFamily="$body" color="$coolGray500" mt="$1">
              {selectedEstablishment.services?.join(", ")}
            </Text>
            <Text
              fontFamily="$body"
              mt="$1"
              color={selectedEstablishment.open_status === "OPEN" ? "$green500" : "$coolGray400"}
            >
              {selectedEstablishment.open_status === "OPEN" ? "ABERTO" : "FECHADO"}
            </Text>
          </VStack>
        )}

        <Button
          title="Solicitar Vinculacao"
          onPress={handleAffiliate}
          isLoading={isLoading}
        />

        <Pressable onPress={() => setStep("search")} mt="$4">
          <Text fontFamily="$body" color="$green600" textAlign="center">
            Voltar e escolher outro
          </Text>
        </Pressable>
      </VStack>
    </ScrollView>
  );
}
