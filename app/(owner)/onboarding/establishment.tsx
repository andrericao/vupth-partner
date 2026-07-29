import { useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { Header } from "@components/Header";
import { NwInput } from "@components/nw/Input";
import { SelectService } from "@components/SelectService";
import { NwButton } from "@components/nw/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { useAuthStore } from "@store/auth.store";
import { getApiErrorMessage } from "@lib/api";

export default function EstablishmentScreen() {
  const [ownerName, setOwnerName] = useState("");
  const [name, setName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const quickCreate = useEstablishmentStore((s) => s.quickCreate);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const handleSubmit = async () => {
    if (!ownerName.trim() || !name.trim() || !serviceType) {
      setIsInvalid(true);
      return;
    }

    setIsInvalid(false);
    setIsLoading(true);

    try {
      await quickCreate(name.trim(), serviceType);
      await SecureStore.setItemAsync("vupth_owner_name", ownerName.trim());

      try {
        await refreshToken();
      } catch {}

      const establishment = useEstablishmentStore.getState().establishment;
      router.replace({
        pathname: "/(owner)/onboarding/also-professional",
        params: {
          establishmentId: establishment?.id ?? "",
          ownerName: ownerName.trim(),
        },
      } as any);
    } catch (error: any) {
      const code = error?.response?.data?.code;
      if (code === "VALIDATION_ERROR") {
        const fieldErrors = error.response.data.fieldErrors;
        const msg = Object.values(fieldErrors).join("\n");
        Alert.alert("Erro de validação", msg);
      } else {
        Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível criar o estabelecimento. Tente novamente."));
      }
    } finally {
      setIsLoading(false);
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
        <View className="flex-1 py-12 px-6 items-center justify-center">
          <Header showBackButton onBack={() => router.navigate("/(owner)/dashboard" as any)} />

          <View className="flex-1 mt-48 w-full">
            <Text className="font-heading text-3xl mb-12 text-gray-900">
              Dados da Loja
            </Text>

            <NwInput
              label="Seu nome"
              placeholder="Ex: João Silva"
              value={ownerName}
              onChangeText={setOwnerName}
              error={isInvalid ? "Nome obrigatório" : ""}
            />

            <NwInput
              label="Nome da Loja"
              placeholder="Rei do Corte LTDA"
              value={name}
              onChangeText={setName}
              error={isInvalid ? "Nome obrigatório" : ""}
            />

            <SelectService value={serviceType} onValueChange={setServiceType} />

            <NwButton
              title="Criar Estabelecimento"
              onPress={handleSubmit}
              isLoading={isLoading}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
