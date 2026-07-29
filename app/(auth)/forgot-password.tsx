import { useState } from "react";
import {
  VStack,
  FormControl,
  Heading,
  Text,
  ScrollView,
} from "@gluestack-ui/themed";
import { router } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { InputPassword } from "@components/InputPassWord";
import { Button } from "@components/Button";
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
        w="$full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <VStack flex={1} py="$12" px="$6">
          <Header showBackButton onBack={() => router.replace("/(auth)/login" as any)} />

          <Heading mt="$8" size="2xl" fontFamily="$heading">
            Recuperar senha
          </Heading>

          {step === "email" ? (
            <VStack mt="$6" space="md">
              <Text fontFamily="$body" color="$coolGray600">
                Informe o e-mail da sua conta. Enviaremos um codigo de 6 digitos
                para redefinir a senha.
              </Text>
              <FormControl isInvalid={emailInvalid}>
                <Input
                  placeholder="email@email.com"
                  textLabel="E-mail"
                  messageError="E-mail invalido"
                  value={email}
                  onChangeText={(t: string) => {
                    setEmail(t);
                    if (emailInvalid) setEmailInvalid(false);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  testID="forgot-email"
                />
              </FormControl>
              <Button
                title={isLoading ? "Enviando..." : "Enviar codigo"}
                onPress={handleSendCode}
                isLoading={isLoading}
                mt="$2"
              />
            </VStack>
          ) : (
            <VStack mt="$6" space="md">
              <Text fontFamily="$body" color="$coolGray600">
                Digite o codigo de 6 digitos enviado para{" "}
                <Text fontFamily="$body" fontWeight="$bold" color="$coolGray800">
                  {email.trim()}
                </Text>{" "}
                e escolha a nova senha. O codigo vale por 15 minutos.
              </Text>

              <FormControl isInvalid={codeInvalid}>
                <Input
                  placeholder="000000"
                  textLabel="Codigo (6 digitos)"
                  messageError="O codigo tem 6 digitos numericos"
                  value={code}
                  onChangeText={(t: string) => {
                    setCode(t);
                    if (codeInvalid) setCodeInvalid(false);
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoCapitalize="none"
                  testID="forgot-code"
                />
              </FormControl>

              <FormControl isInvalid={passwordInvalid}>
                <InputPassword
                  placeholder="nova senha"
                  textLabel="Nova senha"
                  messageError="A senha nao atende aos requisitos abaixo"
                  value={password}
                  onChangeText={(t: string) => {
                    setPassword(t);
                    if (passwordInvalid) setPasswordInvalid(false);
                  }}
                  testID="forgot-password"
                />
              </FormControl>
              {password.length > 0 && <PasswordRules rules={passwordRules} />}

              <FormControl isInvalid={confirmInvalid}>
                <InputPassword
                  placeholder="confirmar nova senha"
                  textLabel="Confirmar nova senha"
                  messageError="As senhas nao coincidem"
                  value={confirmPassword}
                  onChangeText={(t: string) => {
                    setConfirmPassword(t);
                    if (confirmInvalid) setConfirmInvalid(false);
                  }}
                  testID="forgot-confirm"
                />
              </FormControl>

              <Button
                title={isLoading ? "Redefinindo..." : "Redefinir senha"}
                onPress={handleReset}
                isLoading={isLoading}
                mt="$2"
              />
              <Button
                title="Reenviar codigo"
                onPress={handleSendCode}
                bg="$coolGray200"
                textColor="$coolGray700"
                h="$10"
                mt="$0"
              />
            </VStack>
          )}
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
