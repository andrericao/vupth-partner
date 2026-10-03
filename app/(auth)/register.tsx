import { useState } from "react";
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { ChevronLeft, Mail, Lock } from "lucide-react-native";
import { useAuthStore } from "@store/auth.store";
import { getPostLoginRoute } from "@lib/routing";
import { getApiErrorMessage } from "@lib/api";
import { segundosDeEspera, textoDaEspera } from "@lib/erroDeAcesso";
import { validatePassword, getPasswordRules } from "@lib/passwordValidation";
import { PasswordRules } from "@components/PasswordRules";

export default function RegisterScreen() {
  // Rodape ancorado precisa do inset REAL: `pb-8` fixo nao conhece a barra
  // de navegacao do aparelho, e em device com barra por gestos o CTA invadia
  // ela (DS1, QA de device). O 32 e o piso pra tela sem barra nenhuma.
  const insets = useSafeAreaInsets();
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
      } else if (error?.response?.status === 429) {
        Alert.alert("Espere um pouco", textoDaEspera(segundosDeEspera(error)));
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
        <View className="flex-1 pt-14 px-4" style={{ paddingBottom: Math.max(insets.bottom, 32) }}>
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-vupth-surface items-center justify-center"
            accessibilityRole="button"
            testID="back-button"
          >
            <ChevronLeft size={20} color="#163300" />
          </Pressable>

          {/* O titulo diz o PAPEL escolhido na tela anterior: quem chega aqui
              já decidiu, e ver a escolha confirmada evita a dúvida de "será que
              cliquei no lugar certo?". Sem papel (link direto), cai no
              generico. */}
          <View className="mt-10 gap-2">
            <Text className="font-display text-f13 tracking-[2px] text-vupth-forest">
              VUPTH
            </Text>
            <Text className="font-display text-f30 leading-[32px] text-vupth-forest">
              {role === "owner"
                ? "Criar conta de dono"
                : role === "professional"
                  ? "Criar conta de profissional"
                  : "Criar conta"}
            </Text>
          </View>

          <View className="mt-8">

            <NwInput
              label="E-mail"
              icon={Mail}
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
              icon={Lock}
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
              icon={Lock}
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

          </View>

          <View className="flex-1 justify-end gap-4 mt-8">
            <NwButton title="Criar conta" onPress={handleSubmit} isLoading={isLoading} testID="register-submit" />
            <View className="flex-row justify-center items-center gap-1.5">
              <Text className="font-body text-f13 text-vupth-textSecondary">Já é cadastrado?</Text>
              <Pressable
                onPress={() => router.push(`/(auth)/login?role=${role ?? ""}` as any)}
                testID="go-login"
              >
                <Text className="font-heading text-f13 text-vupth-forest">Entrar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
