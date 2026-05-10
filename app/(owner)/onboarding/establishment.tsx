import { useState } from "react";
import { VStack, FormControl, Heading, ScrollView } from "@gluestack-ui/themed";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { SelectService } from "@components/SelectService";
import { StepsButton } from "@components/StepsButton";

export default function EstablishmentScreen() {
  const [name, setName] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);

  const handleNext = () => {
    if (!name.trim()) {
      setIsInvalid(true);
      return;
    }
    setIsInvalid(false);
    router.push("/(owner)/onboarding/address");
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
            Dados da Loja
          </Heading>

          <Input
            textLabel="Nome da Loja"
            placeholder="Rei do Corte LTDA"
            messageError="Nome obrigatório"
            value={name}
            onChangeText={setName}
          />

          <SelectService />

          <StepsButton title="Endereço" onPress={handleNext} />
        </FormControl>
      </VStack>
    </ScrollView>
  );
}
