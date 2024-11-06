import { useState } from "react";

import {
  VStack,
  FormControl,
  Heading,
  HStack,
  Text,
  Link,
  LinkText,
  ScrollView,
} from "@gluestack-ui/themed";

import { Button } from "@components/Button";
import { Input } from "@components/Input";
import { InputPassword } from "@components/InputPassWord";

export function Login({ navigation }) {
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
        <FormControl flex={1} mt="$48" isInvalid={isInvalid}>
          <Heading mb="$12" size="3xl" fontFamily="$heading">
            Login
          </Heading>
          <Input
            placeholder="email@empresa.com"
            messageError="Oi"
            textLabel="Email"
            value={inputValue}
            onChangeText={(inputValue) => setInputValue(inputValue)}
            keyboardType="email-address"
          />
          <InputPassword
            placeholder="senha"
            messageError="Oi"
            textLabel="Senha"
          />

          <Link mt="$6" onPress={() => navigation.navigate("SingUp")}>
            <LinkText textAlign="right" fontFamily="$body">Esqueceu a senha?</LinkText>
          </Link>
          <Button title="Entrar" onPress={handleSubmit} />
        </FormControl>

        <HStack mt="$12" space="xs" flex={1}>
          <Text fontFamily="$body">Não possui cadastro? </Text>
          <Link onPress={() => navigation.navigate("SingUp")}>
            <LinkText fontFamily="$body">Criar Conta</LinkText>
          </Link>
        </HStack>
      </VStack>
    </ScrollView>
  );
}
