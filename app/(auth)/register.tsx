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
import { router, useLocalSearchParams } from "expo-router";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { InputPassword } from "@components/InputPassWord";
import { Button } from "@components/Button";

export default function RegisterScreen() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);

  const handleSubmit = () => {
    if (email.length < 6 || password.length < 6) {
      setIsInvalid(true);
      return;
    }
    setIsInvalid(false);
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
            Cadastrar
          </Heading>

          <Input
            placeholder="email@email.com"
            textLabel="E-mail"
            messageError="E-mail inválido"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <InputPassword
            placeholder="senha"
            textLabel="Senha"
            messageError="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
          />

          <Button title="Criar Conta" onPress={handleSubmit} />
        </FormControl>

        <HStack mt="$12" space="xs" flex={1}>
          <Text fontFamily="$body">Já é cadastrado? </Text>
          <Link onPress={() => router.push("/(auth)/login")}>
            <LinkText fontFamily="$body">Login</LinkText>
          </Link>
        </HStack>
      </VStack>
    </ScrollView>
  );
}
