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
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { InputPassword } from "@components/InputPassWord";
import { Button } from "@components/Button";
import { useAuthStore } from "@store/auth.store";
import { getPostLoginRoute } from "@lib/routing";
import { getApiErrorMessage } from "@lib/api";
import { validatePassword, getPasswordRules } from "@lib/passwordValidation";
import { PasswordRules } from "@components/PasswordRules";

export default function RegisterScreen() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEmailInvalid, setIsEmailInvalid] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const register = useAuthStore((s) => s.register);
  const login = useAuthStore((s) => s.login);

  // Validacao AO VIVO (espelhada do front-client): checklist de senha + confirma
  // em tempo real enquanto digita.
  const passwordRules = getPasswordRules(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async () => {
    const emailInvalid = email.length < 6 || !email.includes("@");
    const pwCheck = validatePassword(password);
    const mismatch = password !== confirmPassword;

    setIsEmailInvalid(emailInvalid);
    setPasswordErrors(pwCheck.errors);
    setConfirmError(mismatch ? "As senhas não coincidem" : null);

    if (emailInvalid || !pwCheck.valid || mismatch) return;

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
        Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível criar a conta. Tente novamente."));
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
            Cadastrar
          </Heading>

          <FormControl isInvalid={isEmailInvalid}>
            <Input
              placeholder="email@email.com"
              textLabel="E-mail"
              messageError="E-mail inválido"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (isEmailInvalid) setIsEmailInvalid(false);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              testID="register-email"
            />
          </FormControl>

          <FormControl isInvalid={passwordErrors.length > 0}>
            <InputPassword
              placeholder="senha"
              textLabel="Senha"
              messageError={passwordErrors[0] ?? "Senha inválida"}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (passwordErrors.length) setPasswordErrors([]);
              }}
              testID="register-password"
            />
          </FormControl>

          {password.length > 0 && <PasswordRules rules={passwordRules} />}

          <FormControl isInvalid={!!confirmError}>
            <InputPassword
              placeholder="confirmar senha"
              textLabel="Confirmar senha"
              messageError={confirmError ?? "As senhas não coincidem"}
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                if (confirmError) setConfirmError(null);
              }}
              testID="register-confirm-password"
            />
          </FormControl>

          {confirmPassword.length > 0 && (
            <Text
              fontFamily="$body"
              fontSize="$xs"
              mb="$3"
              color={passwordsMatch ? "$green600" : "$red500"}
            >
              {passwordsMatch ? "Senhas conferem" : "Senhas não conferem"}
            </Text>
          )}

          <Button
            title="Criar Conta"
            onPress={handleSubmit}
            isLoading={isLoading}
          />
        </VStack>

        <HStack mt="$12" space="xs" flex={1}>
          <Text fontFamily="$body">Já é cadastrado? </Text>
          <Link onPress={() => router.push(`/(auth)/login?role=${role ?? ""}`)}>
            <LinkText fontFamily="$body">Login</LinkText>
          </Link>
        </HStack>
      </VStack>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
