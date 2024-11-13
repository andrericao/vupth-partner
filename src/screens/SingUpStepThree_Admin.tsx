import { useState } from "react";

import { VStack, FormControl, Heading, ScrollView } from "@gluestack-ui/themed";

import { Input } from "@components/Input";
import { Header } from "@components/Header";
import { StepsButton } from "@components/StepsButton";
import { SelectService } from "@components/SelectService";

import { SingUpStepTrhee_AdminScreenProps } from "src/@types/navigation/NavigationScreensTypes";

export function SingUpStepTrhee_Admin({
  navigation,
}: SingUpStepTrhee_AdminScreenProps) {
  const [isInvalid, setIsInvalid] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = () => {
    if (inputValue.length < 6) {
      setIsInvalid(true);
    } else {
      setIsInvalid(false);
    }
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
            //value={inputValue}
            //onChangeText={(inputValue) => setInputValue(inputValue)}
            messageError="Test"
          />

          <SelectService />

          <StepsButton
            title="Loja"
            onPress={() => navigation.navigate("SingUpStepTwo_Shop")}
          />
        </FormControl>
      </VStack>
    </ScrollView>
  );
}
