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
import { Alert } from "react-native";
import { Button } from "@components/Button";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { InputPassword } from "@components/InputPassWord";
import { useAuthStore } from "@store/auth.store";
import { getPostLoginRoute } from "@lib/routing";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((s) => s.login);

  const handleSubmit = async () => {
    if (email.length < 6 || password.length < 6) {
      setIsInvalid(true);
      return;
    }

    setIsInvalid(false);
    setIsLoading(true);

    try {
      await login(email, password);

      const roles = useAuthStore.getState().user?.roles ?? [];
      const route = getPostLoginRoute(roles);
      router.replace(route as any);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401) {
        Alert.alert("Erro", "E-mail ou senha inválidos");
      } else {
        Alert.alert("Erro", "Não foi possível fazer login. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
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
            autoCapitalize="none"
          />
          <InputPassword
            placeholder="senha"
            messageError="Mínimo 6 caracteres"
            textLabel="Senha"
            value={password}
            onChangeText={setPassword}
          />

          <Button
            title="Entrar"
            onPress={handleSubmit}
            isLoading={isLoading}
          />
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
