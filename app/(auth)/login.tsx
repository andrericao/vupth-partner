import { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Header } from "@components/Header";
import { NwButton } from "@components/nw/Button";
import { NwInput } from "@components/nw/Input";
import { useAuthStore } from "@store/auth.store";
import { getPostLoginRoute } from "@lib/routing";
import { getApiErrorMessage } from "@lib/api";

// 1a tela convertida p/ NativeWind (Gluestack v2, migracao faseada). A LOGICA e
// identica ao v1 — so a apresentacao trocou (RN + className + nw/Input +
// nw/Button). O `Header` segue no v1 (componente compartilhado, migra depois).
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
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 py-12 px-6 items-center justify-center">
          <Header showBackButton />

          <View className="flex-1 mt-48 w-full">
            <Text className="font-heading text-3xl mb-12 text-gray-900">Login</Text>

            <NwInput
              label="Email"
              placeholder="email@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              testID="login-email"
              error={isEmailInvalid ? "E-mail inválido" : ""}
            />
            <NwInput
              label="Senha"
              placeholder="senha"
              secure
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              testID="login-password"
              error={isPasswordInvalid ? "Informe sua senha (mínimo 6 caracteres)" : ""}
            />

            {/* [igual front-client] "Entrando..." em texto (nao spinner); o
                handleSubmit ja guarda o duplo-clique. */}
            <NwButton
              title={isLoading ? "Entrando..." : "Entrar"}
              onPress={handleSubmit}
              className="mt-9"
            />

            {/* S7 LIGADO (backend fatia 1): codigo de 6 digitos por e-mail. */}
            <Pressable
              onPress={() => router.push("/(auth)/forgot-password" as any)}
              className="mt-4 self-center"
            >
              <Text className="font-body text-sm text-vupth-forest font-medium">
                Esqueci minha senha
              </Text>
            </Pressable>
          </View>

          <View className="mt-12 flex-1 w-full">
            <Text className="font-body text-center text-gray-500">
              Não possui cadastro?
            </Text>
            <NwButton
              title="Criar conta"
              variant="outlineBrand"
              onPress={() => router.push("/(auth)")}
              className="mt-2"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
