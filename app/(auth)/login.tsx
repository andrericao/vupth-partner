import { useState } from "react";
import {
  VStack,
  FormControl,
  Heading,
  Text,
  ScrollView,
} from "@gluestack-ui/themed";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Button } from "@components/Button";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { InputPassword } from "@components/InputPassWord";
import { useAuthStore } from "@store/auth.store";
import { getPostLoginRoute } from "@lib/routing";
import { getApiErrorMessage } from "@lib/api";

export default function LoginScreen() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailInvalid, setIsEmailInvalid] = useState(false);
  const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((s) => s.login);

  const handleSubmit = async () => {
    if (isLoading) return;
    const emailInvalid = email.length < 6 || !email.includes("@");
    const passwordInvalid = password.length < 6;
    setIsEmailInvalid(emailInvalid);
    setIsPasswordInvalid(passwordInvalid);
    if (emailInvalid || passwordInvalid) return;

    setIsLoading(true);

    try {
      await login(email, password);

      const roles = useAuthStore.getState().user?.roles ?? [];
      const intent = role as "owner" | "professional" | undefined;
      const route = getPostLoginRoute(roles, intent);
      router.replace(route as any);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401) {
        Alert.alert("Erro", "E-mail ou senha inválidos");
      } else {
        Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível fazer login. Tente novamente."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <VStack
        flex={1}
        py="$12"
        px="$6"
        alignItems="center"
        justifyContent="center"
      >
        <Header showBackButton />
        <VStack flex={1} mt="$48" w="$full">
          <Heading mb="$12" size="3xl" fontFamily="$heading">
            Login
          </Heading>
          <FormControl isInvalid={isEmailInvalid}>
            <Input
              placeholder="email@email.com"
              messageError="E-mail inválido"
              textLabel="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              testID="login-email"
            />
          </FormControl>
          <FormControl isInvalid={isPasswordInvalid}>
            <InputPassword
              placeholder="senha"
              messageError="Informe sua senha (mínimo 6 caracteres)"
              textLabel="Senha"
              value={password}
              onChangeText={setPassword}
              testID="login-password"
            />
          </FormControl>

          {/* [igual front-client] mostra "Entrando..." em texto no lugar do
              spinner enquanto autentica. handleSubmit ja guarda duplo-clique. */}
          <Button
            title={isLoading ? "Entrando..." : "Entrar"}
            onPress={handleSubmit}
          />
        </VStack>

        <VStack mt="$12" space="sm" flex={1} w="$full">
          <Text fontFamily="$body" textAlign="center" color="$coolGray500">
            Não possui cadastro?
          </Text>
          <Button
            title="Criar conta"
            onPress={() => router.push("/(auth)")}
            mt="$2"
            bg="$white"
            borderWidth="$1"
            borderColor="$green500"
            $active-bg="$coolGray100"
            textColor="$green500"
          />
        </VStack>
      </VStack>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
