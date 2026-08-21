import { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { NwButton } from "@components/nw/Button";
import { Ionicons } from "@expo/vector-icons";
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
        <View className="flex-1 pt-14 pb-8 px-7">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-vupth-surface items-center justify-center"
            accessibilityRole="button"
            testID="back-button"
          >
            <Ionicons name="chevron-back" size={20} color="#163300" />
          </Pressable>

          <View className="mt-10 gap-2">
            <Text className="font-display text-[13px] tracking-[2px] text-vupth-forest">
              VUPTH
            </Text>
            <Text className="font-display text-[30px] text-vupth-forest">Entrar</Text>
          </View>

          <View className="mt-8">
            <NwInput
              label="E-mail"
              icon="mail-outline"
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
              icon="lock-closed-outline"
              placeholder="senha"
              secure
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              testID="login-password"
              error={isPasswordInvalid ? "Informe sua senha (mínimo 6 caracteres)" : ""}
            />

            {/* S7 LIGADO (backend fatia 1): codigo de 6 digitos por e-mail. */}
            <Pressable
              onPress={() => router.push("/(auth)/forgot-password" as any)}
              className="self-end mt-1"
            >
              <Text className="font-body text-[13px] text-vupth-forest font-semibold">
                Esqueci minha senha
              </Text>
            </Pressable>
          </View>

          {/* CTA ancorado no rodape em vez de solto no meio (era `mt-48` +
              `mt-12`, que centralizava no chute e mudava de lugar conforme o
              teclado). */}
          <View className="flex-1 justify-end gap-4">
            {/* [igual front-client] "Entrando..." em texto (nao spinner); o
                handleSubmit ja guarda o duplo-clique. */}
            <NwButton
              title={isLoading ? "Entrando..." : "Entrar"}
              onPress={handleSubmit}
            />
            {/* "Criar conta" vira LINK: entrar e o que esta tela pede, e dois
                botoes de peso parecido fazem quem ja tem conta hesitar. */}
            <View className="flex-row justify-center items-center gap-1.5">
              <Text className="font-body text-[13px] text-gray-500">
                Não possui cadastro?
              </Text>
              <Pressable onPress={() => router.push("/(auth)")} testID="go-register">
                <Text className="font-heading text-[13px] text-vupth-forest">
                  Criar conta
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
