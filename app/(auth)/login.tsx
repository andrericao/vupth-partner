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
import { router } from "expo-router";
import { Button } from "@components/Button";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { InputPassword } from "@components/InputPassWord";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);

  const handleSubmit = () => {
    if (email.length < 6 || password.length < 6) {
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
            Login
          </Heading>
          <Input
            placeholder="email@email.com"
            messageError="E-mail inválido"
            textLabel="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <InputPassword
            placeholder="senha"
            messageError="Senha inválida"
            textLabel="Senha"
            value={password}
            onChangeText={setPassword}
          />

          <Button title="Entrar" onPress={handleSubmit} />
        </FormControl>

        <HStack mt="$12" space="xs" flex={1}>
          <Text fontFamily="$body">Não possui cadastro? </Text>
          <Link onPress={() => router.push("/(auth)")}>
            <LinkText fontFamily="$body">Criar Conta</LinkText>
          </Link>
        </HStack>
      </VStack>
    </ScrollView>
  );
}
