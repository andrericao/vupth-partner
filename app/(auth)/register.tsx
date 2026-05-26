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
import { Alert } from "react-native";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { InputPassword } from "@components/InputPassWord";
import { Button } from "@components/Button";
import { useAuthStore } from "@store/auth.store";
import { getPostLoginRoute } from "@lib/routing";

export default function RegisterScreen() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const register = useAuthStore((s) => s.register);
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async () => {
    if (email.length < 6 || password.length < 6) {
      setIsInvalid(true);
      return;
    }

    setIsInvalid(false);
    setIsLoading(true);

    try {
      await register(email, password);
      await login(email, password);

      const roles = useAuthStore.getState().user?.roles ?? [];
      const intent = role as "owner" | "professional" | undefined;
      const route = getPostLoginRoute(roles, intent);
      router.replace(route as any);
    } catch (error: any) {
      const code = error?.response?.data?.code;
      if (code === "VALIDATION_ERROR") {
        const fieldErrors = error.response.data.fieldErrors;
        const msg = Object.values(fieldErrors).join("\n");
        Alert.alert("Erro de validação", msg);
      } else if (error?.response?.status === 409) {
        Alert.alert("Erro", "Este e-mail já está cadastrado");
      } else {
        Alert.alert("Erro", "Não foi possível criar a conta. Tente novamente.");
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
            autoCapitalize="none"
            testID="register-email"
          />

          <InputPassword
            placeholder="senha"
            textLabel="Senha"
            messageError="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            testID="register-password"
          />

          <Button
            title="Criar Conta"
            onPress={handleSubmit}
            isLoading={isLoading}
          />
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
