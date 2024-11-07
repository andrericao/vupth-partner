import { useState } from "react";

import {
  VStack,
  FormControl,
  Heading,
  Text,
  Link,
  HStack,
  LinkText,
  ScrollView,
} from "@gluestack-ui/themed";

import { Input } from "@components/Input";
import { Header } from "@components/Header";
import { StepsButton } from "@components/StepsButton";

import { SingUpStepOne_ContactsScreenProps } from "src/@types/navigation/NavigationScreensTypes";

export function SingUpStepOne_Contacts({
  navigation,
}: SingUpStepOne_ContactsScreenProps) {
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
        <Header />

        <FormControl flex={1} mt="$48" isInvalid={isInvalid}>
          <Heading mb="$12" size="3xl" fontFamily="$heading">
            Cadastrar
          </Heading>

          <Input
            placeholder="melhor barbeiro da silva"
            value={inputValue}
            onChangeText={(inputValue) => setInputValue(inputValue)}
            textLabel="Nome de Usuário"
            messageError="Test"
          />


          <Input
            placeholder="email@email.com"
            value={inputValue}
            onChangeText={(inputValue) => setInputValue(inputValue)}
            textLabel="E-mail"
            messageError="Test"
            keyboardType="email-address"
          />

          <Input
            textLabel="Celular"
            placeholder="(00) 0.0000-0000"
            messageError="#"
            keyboardType="numeric"
          />

          <StepsButton
            title="Loja"
            onPress={() => navigation.navigate("SingUpStepTwo_Shop")}
          />
        </FormControl>

        <HStack mt="$24" space="xs" flex={1}>
          <Text fontFamily="$body">Já é cadastrado? </Text>
          <Link onPress={() => navigation.navigate("Login")}>
            <LinkText fontFamily="$body">Login</LinkText>
          </Link>
        </HStack>
      </VStack>
    </ScrollView>
  );
}
