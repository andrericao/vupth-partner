import { useState } from "react";
import { VStack, FormControl, Heading, ScrollView } from "@gluestack-ui/themed";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { StepsButton } from "@components/StepsButton";

export default function AddressScreen() {
  const [isInvalid, setIsInvalid] = useState(false);

  const handleNext = () => {
    router.push("/(owner)/onboarding/services");
  };

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
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
            Endereço da Loja
          </Heading>

          <Input
            textLabel="CEP"
            placeholder="01310100"
            messageError="CEP inválido"
            keyboardType="number-pad"
          />

          <Input
            textLabel="Logradouro"
            placeholder="Rua de exemplo"
            messageError="Campo obrigatório"
          />

          <Input
            textLabel="Número"
            placeholder="123"
            messageError="Campo obrigatório"
            keyboardType="numeric"
          />

          <Input
            textLabel="Bairro"
            placeholder="Bairro"
            messageError="Campo obrigatório"
          />

          <Input
            textLabel="Cidade"
            placeholder="Cidade"
            messageError="Campo obrigatório"
          />

          <Input
            textLabel="Estado"
            placeholder="SP"
            messageError="Campo obrigatório"
          />

          <StepsButton title="Serviços" onPress={handleNext} />
        </FormControl>
      </VStack>
    </ScrollView>
  );
}
