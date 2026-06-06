import { useState } from "react";
import { VStack, FormControl, Heading, ScrollView } from "@gluestack-ui/themed";
import { KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { Button } from "@components/Button";

export default function ServicesScreen() {
  const [isInvalid, setIsInvalid] = useState(false);

  const handleFinish = () => {
    // TODO: chamar API para criar serviços, depois redirecionar ao dashboard
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
            Serviços Oferecidos
          </Heading>

          <Input
            textLabel="Nome do Serviço"
            placeholder="Corte Degradê"
            messageError="Campo obrigatório"
          />

          <Input
            textLabel="Preço"
            placeholder="35.00"
            messageError="Preço inválido"
            keyboardType="decimal-pad"
          />

          <Input
            textLabel="Duração Estimada (min)"
            placeholder="30"
            messageError="Duração inválida"
            keyboardType="number-pad"
          />

          <Button title="Finalizar Cadastro" onPress={handleFinish} />
        </FormControl>
      </VStack>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
