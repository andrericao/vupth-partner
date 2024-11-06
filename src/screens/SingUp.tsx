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
import { Select } from "@components/Select";
import { InputPassword } from "@components/InputPassWord";
import { Button } from "@components/Button"

export function SingUp({ navigation }) {
  
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
    showsVerticalScrollIndicator={false}>
    <VStack 
      flex={1}
      py="$12"
      px="$6" 
      alignItems="center" 
      justifyContent="center"
    >
      <FormControl flex={1} mt="$48" isInvalid={isInvalid}>
        <Heading mb="$12" size="3xl" fontFamily="$heading">
          Cadastrar
        </Heading>

        <Select />

        <Input
          placeholder="email@empresa.com"
          value={inputValue}
          onChangeText={(inputValue) => setInputValue(inputValue)}
          textLabel="E-mail"
          messageError="Test"
          keyboardType="email-address"
        />

        <InputPassword
          placeholder="senha"
          messageError="Oi"
          textLabel="Senha"
        />
        <InputPassword
          placeholder="senha"
          messageError="Oi"
          textLabel="Confirmar senha"
        />

        <Button title="Cadastrar" onPress={handleSubmit}/>
      </FormControl>

      <HStack mt="$24" space="xs" flex={1}>
        <Text fontFamily="$body">Já é cadastrado? </Text>
        <Link onPress={ () => navigation.navigate("Login") }>
          <LinkText fontFamily="$body">Login</LinkText>
        </Link>
      </HStack>
    </VStack>
    </ScrollView>
  );
}
