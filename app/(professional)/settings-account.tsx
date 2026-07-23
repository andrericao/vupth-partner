import { useState } from "react";
import { VStack, HStack, Heading, Text, ScrollView, FormControl } from "@gluestack-ui/themed";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { Button } from "@components/Button";
import { Input } from "@components/Input";
import { InputPassword } from "@components/InputPassWord";
import { useProfessionalStore } from "@store/professional.store";
import { useAuthStore } from "@store/auth.store";
import { getApiErrorMessage } from "@lib/api";
import { validatePassword } from "@lib/passwordValidation";
import { cardShadow } from "@lib/styles";

type Editing = null | "name" | "nickname" | "email" | "password";

// Nav v2 etapa 3 (Andre 2026-07-23): "as configuracoes do profissional deve ser
// melhor dividida". Esta tela concentra os DADOS CADASTRAIS (nome, apelido,
// e-mail, senha) que antes viviam misturados na Configuracoes gigante.
export default function SettingsAccountScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  const updateMyProfile = useProfessionalStore((s) => s.updateMyProfile);
  const updateNickname = useProfessionalStore((s) => s.updateNickname);
  const user = useAuthStore((s) => s.user);
  const updateEmail = useAuthStore((s) => s.updateEmail);
  const updatePassword = useAuthStore((s) => s.updatePassword);

  const [editing, setEditing] = useState<Editing>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const startEdit = (field: Editing) => {
    setFieldError(null);
    setName(field === "name" ? professional?.name ?? "" : "");
    setNickname(field === "nickname" ? professional?.nickname ?? "" : "");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setEditing(field);
  };

  const cancelEdit = () => {
    setEditing(null);
    setFieldError(null);
  };

  const handleSaveName = async () => {
    const value = name.trim();
    if (value.length < 2) {
      setFieldError("Informe um nome valido.");
      return;
    }
    setFieldError(null);
    setIsSaving(true);
    try {
      await updateMyProfile({ name: value });
      setEditing(null);
      Alert.alert("Nome atualizado", "Seu nome foi alterado com sucesso.");
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel alterar o nome."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNickname = async () => {
    const value = nickname.trim();
    if (value.length > 50) {
      setFieldError("O apelido deve ter no maximo 50 caracteres.");
      return;
    }
    setFieldError(null);
    setIsSaving(true);
    try {
      // String vazia limpa o apelido no backend.
      await updateNickname(value);
      setEditing(null);
      Alert.alert(
        "Apelido atualizado",
        value ? "Seu apelido foi salvo." : "Seu apelido foi removido."
      );
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel salvar o apelido."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFieldError("Informe um e-mail valido.");
      return;
    }
    setFieldError(null);
    setIsSaving(true);
    try {
      await updateEmail(value);
      setEditing(null);
      Alert.alert("E-mail atualizado", "Seu e-mail foi alterado com sucesso.");
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel alterar o e-mail."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    const check = validatePassword(password);
    if (!check.valid) {
      setFieldError(check.errors.join("\n"));
      return;
    }
    if (password !== confirmPassword) {
      setFieldError("As senhas nao coincidem.");
      return;
    }
    setFieldError(null);
    setIsSaving(true);
    try {
      await updatePassword(password);
      setEditing(null);
      Alert.alert("Senha alterada", "Sua senha foi alterada com sucesso.");
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel alterar a senha."));
    } finally {
      setIsSaving(false);
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
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton onBack={() => router.navigate("/(professional)/settings" as any)} />

        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Dados cadastrais
        </Heading>

        <VStack mt="$6" space="md">
          <VStack bg="$white" p="$4" borderRadius="$2xl" style={cardShadow}>
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
              Nome
            </Text>
            {editing === "name" ? (
              <FormControl mt="$2">
                <Input
                  textLabel="Novo nome"
                  placeholder="Seu nome"
                  messageError=""
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
                {fieldError && (
                  <Text fontFamily="$body" fontSize="$xs" color="$red500" mb="$2">
                    {fieldError}
                  </Text>
                )}
                <HStack space="sm">
                  <Button title="Cancelar" onPress={cancelEdit} bg="$coolGray200" textColor="$coolGray700" h="$9" flex={1} />
                  <Button title="Salvar" onPress={handleSaveName} isLoading={isSaving} bg="$green500" $active-bg="$green600" h="$9" flex={1} />
                </HStack>
              </FormControl>
            ) : (
              <>
                <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900" mt="$1">
                  {professional?.name ?? "—"}
                </Text>
                <Button title="Editar" onPress={() => startEdit("name")} bg="$coolGray200" textColor="$coolGray700" h="$9" mt="$2" />
              </>
            )}
          </VStack>

          <VStack bg="$white" p="$4" borderRadius="$2xl" style={cardShadow}>
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
              Apelido
            </Text>
            {editing === "nickname" ? (
              <FormControl mt="$2">
                <Input
                  textLabel="Apelido (ajuda os clientes a te achar na busca)"
                  placeholder="Ex.: Dedeco"
                  messageError=""
                  value={nickname}
                  onChangeText={setNickname}
                  autoCapitalize="words"
                  maxLength={50}
                />
                {fieldError && (
                  <Text fontFamily="$body" fontSize="$xs" color="$red500" mb="$2">
                    {fieldError}
                  </Text>
                )}
                <HStack space="sm">
                  <Button title="Cancelar" onPress={cancelEdit} bg="$coolGray200" textColor="$coolGray700" h="$9" flex={1} />
                  <Button title="Salvar" onPress={handleSaveNickname} isLoading={isSaving} bg="$green500" $active-bg="$green600" h="$9" flex={1} />
                </HStack>
              </FormControl>
            ) : (
              <>
                <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900" mt="$1">
                  {professional?.nickname || "—"}
                </Text>
                <Button title="Editar" onPress={() => startEdit("nickname")} bg="$coolGray200" textColor="$coolGray700" h="$9" mt="$2" />
              </>
            )}
          </VStack>

          <VStack bg="$white" p="$4" borderRadius="$2xl" style={cardShadow}>
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
              E-mail
            </Text>
            {editing === "email" ? (
              <FormControl mt="$2">
                <Input
                  textLabel="Novo e-mail"
                  placeholder="voce@email.com"
                  messageError=""
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {fieldError && (
                  <Text fontFamily="$body" fontSize="$xs" color="$red500" mb="$2">
                    {fieldError}
                  </Text>
                )}
                <HStack space="sm">
                  <Button title="Cancelar" onPress={cancelEdit} bg="$coolGray200" textColor="$coolGray700" h="$9" flex={1} />
                  <Button title="Salvar" onPress={handleSaveEmail} isLoading={isSaving} bg="$green500" $active-bg="$green600" h="$9" flex={1} />
                </HStack>
              </FormControl>
            ) : (
              <>
                <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900" mt="$1">
                  {user?.email ?? "—"}
                </Text>
                <Button title="Editar" onPress={() => startEdit("email")} bg="$coolGray200" textColor="$coolGray700" h="$9" mt="$2" />
              </>
            )}
          </VStack>

          <VStack bg="$white" p="$4" borderRadius="$2xl" style={cardShadow}>
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
              Senha
            </Text>
            {editing === "password" ? (
              <FormControl mt="$2">
                <InputPassword
                  textLabel="Nova senha"
                  placeholder="Nova senha"
                  messageError=""
                  value={password}
                  onChangeText={setPassword}
                />
                <InputPassword
                  textLabel="Confirmar nova senha"
                  placeholder="Confirmar nova senha"
                  messageError=""
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                {fieldError && (
                  <Text fontFamily="$body" fontSize="$xs" color="$red500" mb="$2">
                    {fieldError}
                  </Text>
                )}
                <HStack space="sm">
                  <Button title="Cancelar" onPress={cancelEdit} bg="$coolGray200" textColor="$coolGray700" h="$9" flex={1} />
                  <Button title="Salvar" onPress={handleSavePassword} isLoading={isSaving} bg="$green500" $active-bg="$green600" h="$9" flex={1} />
                </HStack>
              </FormControl>
            ) : (
              <>
                <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900" mt="$1">
                  ********
                </Text>
                <Button title="Alterar" onPress={() => startEdit("password")} bg="$coolGray200" textColor="$coolGray700" h="$9" mt="$2" />
              </>
            )}
          </VStack>
        </VStack>
      </VStack>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
