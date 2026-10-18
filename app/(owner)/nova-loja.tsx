import { useState } from "react";
import { router } from "expo-router";
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwInput } from "@components/nw/Input";
import { SelectService } from "@components/SelectService";
import { NwButton } from "@components/nw/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { getApiErrorMessage } from "@lib/api";
import { ehTetoDeLojas, MSG_TETO_DE_LOJAS } from "@lib/multiLoja";

// multi-loja-do-dono: "Adicionar outra loja" e um fluxo curto — so o nome e o
// tipo. O dono ja existe, entao nao pergunta o nome dele nem se tambem atende.
export default function NovaLojaScreen() {
  const [name, setName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const quickCreate = useEstablishmentStore((s) => s.quickCreate);

  const handleSubmit = async () => {
    if (!name.trim() || !serviceType) {
      setIsInvalid(true);
      return;
    }
    setIsInvalid(false);
    setIsLoading(true);
    try {
      await quickCreate(name.trim(), serviceType);
      router.replace("/(owner)/menu" as any);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        ehTetoDeLojas(error)
          ? MSG_TETO_DE_LOJAS
          : getApiErrorMessage(error, "Não foi possível criar a loja. Tente novamente.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 pb-12 px-4">
          <ScreenHeader title="Adicionar outra loja" onBack={() => router.navigate("/(owner)/menu" as any)} />
          <View className="flex-1 w-full">
            <NwInput
              label="Nome da loja"
              placeholder="Rei do Corte Centro"
              value={name}
              onChangeText={setName}
              error={isInvalid && !name.trim() ? "Nome obrigatório" : ""}
            />
            <SelectService value={serviceType} onValueChange={setServiceType} />
            <NwButton title="Criar loja" onPress={handleSubmit} isLoading={isLoading} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
