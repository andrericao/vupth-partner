import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { ChevronLeft, Mail } from "lucide-react-native";
import { useAuthStore } from "@store/auth.store";
import { getApiErrorMessage } from "@lib/api";
import { avisar } from "@lib/confirmar";
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
  // Rodape ancorado precisa do inset REAL: `pb-8` fixo nao conhece a barra
  // de navegacao do aparelho, e em device com barra por gestos o CTA invadia
  // ela (DS1, QA de device). O 32 e o piso pra tela sem barra nenhuma.
  const insets = useSafeAreaInsets();
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
        "Código enviado",
        "Se este e-mail estiver cadastrado, você receberá um código de 6 dígitos. Ele vale por 15 minutos."
      );
      setStep("code");
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível enviar o código."));
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
      // A senha JA FOI trocada aqui. Com `Alert.alert` a web nao mostrava a
      // caixa, o onPress nunca rodava e o usuario ficava preso no formulario,
      // sem saber que tinha dado certo.
      await avisar({
        titulo: "Senha alterada",
        mensagem: "Sua senha foi redefinida. Entre com a senha nova.",
        ok: "Ir para o login",
      });
      router.replace("/(auth)/login" as any);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível redefinir a senha."));
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
        <View className="flex-1 pt-14 px-4" style={{ paddingBottom: Math.max(insets.bottom, 32) }}>
          <Pressable
            onPress={() => router.replace("/(auth)/login" as any)}
            className="w-10 h-10 rounded-full bg-vupth-surface items-center justify-center"
            accessibilityRole="button"
            testID="back-button"
          >
            <ChevronLeft size={20} color="#163300" />
          </Pressable>

          {/* O titulo acompanha o PASSO: quem ja recebeu o codigo nao esta mais
              recuperando a senha, esta criando uma nova. Mesma decisão do app
              do cliente. */}
          <View className="mt-10 gap-2">
            <Text className="font-display text-[13px] tracking-[2px] text-vupth-forest">
              VUPTH
            </Text>
            <Text className="font-display text-[30px] leading-[32px] text-vupth-forest">
              {step === "email" ? "Esqueceu a senha?" : "Nova senha"}
            </Text>
            <Text className="font-body text-[15px] text-vupth-textSecondary">
              {step === "email"
                ? "Manda o e-mail — te ajudamos a voltar em menos de 1 minuto."
                : "Use o código que enviamos e escolha uma senha nova."}
            </Text>
          </View>

          {step === "email" ? (
            <View className="mt-6">
              <NwInput
                label="E-mail"
                icon={Mail}
                placeholder="email@email.com"
                value={email}
                onChangeText={(t: string) => {
                  setEmail(t);
                  if (emailInvalid) setEmailInvalid(false);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                testID="forgot-email"
                error={emailInvalid ? "E-mail inválido" : ""}
              />
              <NwButton
                title={isLoading ? "Enviando..." : "Enviar código"}
                onPress={handleSendCode}
                isLoading={isLoading}
                className="mt-2"
              />
            </View>
          ) : (
            <View className="mt-6">
              <Text className="font-body text-vupth-textSecondary mb-4">
                Digite o código de 6 dígitos enviado para{" "}
                <Text className="font-body font-bold text-vupth-forest">
                  {email.trim()}
                </Text>{" "}
                e escolha a nova senha. O código vale por 15 minutos.
              </Text>

              <NwInput
                label="Código (6 dígitos)"
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
                error={codeInvalid ? "O código tem 6 dígitos numéricos" : ""}
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
                error={passwordInvalid ? "A senha não atende aos requisitos abaixo" : ""}
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
                error={confirmInvalid ? "As senhas não coincidem" : ""}
              />

              <NwButton
                title={isLoading ? "Redefinindo..." : "Redefinir senha"}
                onPress={handleReset}
                isLoading={isLoading}
                className="mt-2"
              />
              <NwButton
                title="Reenviar código"
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
