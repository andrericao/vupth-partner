import { useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Header } from "@components/Header";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { useAuthStore } from "@store/auth.store";
import { getApiErrorMessage } from "@lib/api";
import { validatePassword, getPasswordRules } from "@lib/passwordValidation";
import { PasswordRules } from "@components/PasswordRules";

// Esqueci minha senha (S7, backend fatia 1 2026-07-20).
// Passo 1: e-mail -> POST /auth/forgot-password (SEMPRE 200 — anti-enumeracao:
//   o texto de sucesso nao pode afirmar que o e-mail existe).
// Passo 2: codigo de 6 digitos + nova senha -> POST /auth/reset-password
//   (codigo vale 15min, uso unico, max 5 tentativas; erros RESET_CODE_INVALID/
//   RESET_CODE_EXPIRED traduzidos no getApiErrorMessage).
// ⚠️ Enquanto o SMTP (S8) nao estiver configurado no ambiente, o e-mail real
// nao chega (NoOpEmailSender so loga o codigo no servidor).
export default function ForgotPasswordScreen() {
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const resetPassword = useAuthStore((s) => s.resetPassword);

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailInvalid, setEmailInvalid] = useState(false);
  const [codeInvalid, setCodeInvalid] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState(false);
  const [confirmInvalid, setConfirmInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordRules = getPasswordRules(password);

  const handleSendCode = async () => {
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailInvalid(true);
      return;
    }
    setEmailInvalid(false);
    setIsLoading(true);
    try {
      await forgotPassword(value);
      // Sempre 200 (anti-enumeracao) — por isso o texto e "SE estiver cadastrado".
      Alert.alert(
        "Codigo enviado",
        "Se este e-mail estiver cadastrado, voce recebera um codigo de 6 digitos. Ele vale por 15 minutos."
      );
      setStep("code");
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel enviar o codigo."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    const codeOk = /^\d{6}$/.test(code.trim());
    const pwOk = validatePassword(password).valid;
    const matchOk = password === confirmPassword;
    setCodeInvalid(!codeOk);
    setPasswordInvalid(!pwOk);
    setConfirmInvalid(!matchOk);
    if (!codeOk || !pwOk || !matchOk) return;

    setIsLoading(true);
    try {
      await resetPassword(email.trim(), code.trim(), password);
      Alert.alert("Senha alterada", "Sua senha foi redefinida. Entre com a senha nova.", [
        { text: "Ir para o login", onPress: () => router.replace("/(auth)/login" as any) },
      ]);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel redefinir a senha."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 py-12 px-6">
          <Header showBackButton onBack={() => router.replace("/(auth)/login" as any)} />

          <Text className="font-heading text-2xl mt-8 text-gray-900">
            Recuperar senha
          </Text>

          {step === "email" ? (
            <View className="mt-6">
              <Text className="font-body text-gray-600 mb-4">
                Informe o e-mail da sua conta. Enviaremos um codigo de 6 digitos
                para redefinir a senha.
              </Text>
              <NwInput
                label="E-mail"
                placeholder="email@email.com"
                value={email}
                onChangeText={(t: string) => {
                  setEmail(t);
                  if (emailInvalid) setEmailInvalid(false);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                testID="forgot-email"
                error={emailInvalid ? "E-mail invalido" : ""}
              />
              <NwButton
                title={isLoading ? "Enviando..." : "Enviar codigo"}
                onPress={handleSendCode}
                isLoading={isLoading}
                className="mt-2"
              />
            </View>
          ) : (
            <View className="mt-6">
              <Text className="font-body text-gray-600 mb-4">
                Digite o codigo de 6 digitos enviado para{" "}
                <Text className="font-body font-bold text-gray-800">
                  {email.trim()}
                </Text>{" "}
                e escolha a nova senha. O codigo vale por 15 minutos.
              </Text>

              <NwInput
                label="Codigo (6 digitos)"
                placeholder="000000"
                value={code}
                onChangeText={(t: string) => {
                  setCode(t);
                  if (codeInvalid) setCodeInvalid(false);
                }}
                keyboardType="number-pad"
                maxLength={6}
                autoCapitalize="none"
                testID="forgot-code"
                error={codeInvalid ? "O codigo tem 6 digitos numericos" : ""}
              />

              <NwInput
                label="Nova senha"
                placeholder="nova senha"
                secure
                value={password}
                onChangeText={(t: string) => {
                  setPassword(t);
                  if (passwordInvalid) setPasswordInvalid(false);
                }}
                autoCapitalize="none"
                testID="forgot-password"
                error={passwordInvalid ? "A senha nao atende aos requisitos abaixo" : ""}
              />
              {password.length > 0 && <PasswordRules rules={passwordRules} />}

              <NwInput
                label="Confirmar nova senha"
                placeholder="confirmar nova senha"
                secure
                value={confirmPassword}
                onChangeText={(t: string) => {
                  setConfirmPassword(t);
                  if (confirmInvalid) setConfirmInvalid(false);
                }}
                autoCapitalize="none"
                testID="forgot-confirm"
                error={confirmInvalid ? "As senhas nao coincidem" : ""}
              />

              <NwButton
                title={isLoading ? "Redefinindo..." : "Redefinir senha"}
                onPress={handleReset}
                isLoading={isLoading}
                className="mt-2"
              />
              <NwButton
                title="Reenviar codigo"
                variant="secondary"
                onPress={handleSendCode}
                className="h-10 mt-3"
              />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
