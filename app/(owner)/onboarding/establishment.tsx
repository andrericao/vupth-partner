import { useState } from "react";
import { VStack, FormControl, Heading, ScrollView } from "@gluestack-ui/themed";
import { router } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { SelectService } from "@components/SelectService";
import { Button } from "@components/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { useAuthStore } from "@store/auth.store";

export default function EstablishmentScreen() {
  const [name, setName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const quickCreate = useEstablishmentStore((s) => s.quickCreate);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const handleSubmit = async () => {
    if (!name.trim() || !serviceType) {
      setIsInvalid(true);
      return;
    }

    setIsInvalid(false);
    setIsLoading(true);

    try {
      await quickCreate(name.trim(), serviceType);

      try {
        await refreshToken();
      } catch {}

      router.replace("/(owner)/dashboard" as any);
    } catch (error: any) {
      const code = error?.response?.data?.code;
      if (code === "VALIDATION_ERROR") {
        const fieldErrors = error.response.data.fieldErrors;
        const msg = Object.values(fieldErrors).join("\n");
        Alert.alert("Erro de validação", msg);
      } else {
        Alert.alert("Erro", "Não foi possível criar o estabelecimento. Tente novamente.");
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
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <VStack
        flex={1}
        py="$12"
        px="$6"
        alignItems="center"
        justifyContent="center"
      >
        <Header showBackButton />

        <FormControl flex={1} mt="$48" isInvalid={isInvalid}>
          <Heading mb="$12" size="3xl" fontFamily="$heading">
            Dados da Loja
          </Heading>

          <Input
            textLabel="Nome da Loja"
            placeholder="Rei do Corte LTDA"
            messageError="Nome obrigatório"
            value={name}
            onChangeText={setName}
          />

          <SelectService value={serviceType} onValueChange={setServiceType} />

          <Button
            title="Criar Estabelecimento"
            onPress={handleSubmit}
            isLoading={isLoading}
          />
        </FormControl>
      </VStack>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
