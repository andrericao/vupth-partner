import { useState } from "react";

import { VStack, FormControl, Heading, ScrollView } from "@gluestack-ui/themed";

import { Input } from "@components/Input";
import { StepsButton } from "@components/StepsButton";
import { InputSearch } from "@components/InputSearch";
import { Header } from "@components/Header";

import { SingUpStepTwo_ShopScreenProps } from "src/@types/navigation/NavigationScreensTypes";

export function SingUpStepTwo_Shop({
  navigation,
}: SingUpStepTwo_ShopScreenProps) {
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
        space="xl"
        alignItems="center"
        justifyContent="center"
      >
        <Header showBackButton />

        <InputSearch
            placeholder="Pesquisar lojas cadastradas"
            textLabel="Pesquisar Lojas"
          />

        <FormControl flex={1} isInvalid={isInvalid}>
          <Heading mb="$12" size="3xl" fontFamily="$heading">
            Endereço da Loja
          </Heading>

          <InputSearch
            placeholder="Pesquisar lojas cadastradas"
            textLabel="Pesquisar Lojas"
          />

          <Input
            textLabel="CEP"
            placeholder="CEP do Estabelecimento"
            messageError="Oi"
            //value={inputValue}
            //onChangeText={(inputValue) => setInputValue(inputValue)}
            keyboardType="number-pad"
          />

          <Input
            textLabel="Logradouro"
            placeholder="Rua de exemplo"
            messageError="Oi"
            //value={}
            //onChangeText={() => setInputValue(inputValue)}
          />

          <Input
            textLabel="Número"
            placeholder="Número"
            messageError="Oi"
            //value={}
            //onChangeText={() => setInputValue(inputValue)}
            keyboardType="numeric"
          />

          <Input
            textLabel="Bairro"
            placeholder="Bairro"
            messageError="Oi"
            //value={}
            //onChangeText={() => setInputValue(inputValue)}
          />

          <Input
            textLabel="Cidade"
            placeholder="Cidade"
            messageError="Oi"
            //value={}
            //onChangeText={() => setInputValue(inputValue)}
          />

          <Input
            textLabel="Estado"
            placeholder="Estado"
            messageError="Oi"
            //value={}
            //onChangeText={() => setInputValue(inputValue)}
          />

          <StepsButton
            title="Dados Pessoais"
            onPress={() => navigation.navigate("SingUpStepTrhee_Admin")}
          />
        </FormControl>
      </VStack>
    </ScrollView>
  );
}
