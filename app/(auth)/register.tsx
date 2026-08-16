import { useState } from "react";
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Header } from "@components/Header";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
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
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 py-12 px-6 items-center justify-center">
          <Header showBackButton />

          <View className="flex-1 mt-48 w-full">
            <Text className="font-heading text-3xl mb-12 text-gray-900">Cadastrar</Text>

            <NwInput
              label="E-mail"
              placeholder="email@email.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (isEmailInvalid) setIsEmailInvalid(false);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              testID="register-email"
              error={isEmailInvalid ? "E-mail inválido" : ""}
            />

            <NwInput
              label="Senha"
              placeholder="senha"
              secure
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (passwordErrors.length) setPasswordErrors([]);
              }}
              autoCapitalize="none"
              testID="register-password"
              error={passwordErrors.length > 0 ? (passwordErrors[0] ?? "Senha inválida") : ""}
            />

            {password.length > 0 && <PasswordRules rules={passwordRules} />}

            <NwInput
              label="Confirmar senha"
              placeholder="confirmar senha"
              secure
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                if (confirmError) setConfirmError(null);
              }}
              autoCapitalize="none"
              testID="register-confirm-password"
              error={confirmError ?? ""}
            />

            {confirmPassword.length > 0 && (
              <Text
                className={`font-body text-xs mb-3 ${passwordsMatch ? "text-vupth-forest" : "text-vupth-danger"}`}
              >
                {passwordsMatch ? "Senhas conferem" : "Senhas não conferem"}
              </Text>
            )}

            <NwButton title="Criar Conta" onPress={handleSubmit} isLoading={isLoading} />
          </View>

          <View className="mt-12 flex-1 w-full">
            <Text className="font-body text-center text-gray-500">Já é cadastrado?</Text>
            <NwButton
              title="Fazer login"
              variant="outlineBrand"
              onPress={() => router.push(`/(auth)/login?role=${role ?? ""}`)}
              className="mt-2"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
