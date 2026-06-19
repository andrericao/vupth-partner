import { useState, useEffect, useCallback } from "react";
import { VStack, HStack, Heading, Text, ScrollView, Divider, FormControl } from "@gluestack-ui/themed";
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

type Editing = null | "name" | "email" | "password";

export default function ProfessionalSettingsScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  const leaveEstablishment = useProfessionalStore((s) => s.leaveEstablishment);
  const updateMyProfile = useProfessionalStore((s) => s.updateMyProfile);
  const fetchMyAffiliations = useProfessionalStore((s) => s.fetchMyAffiliations);
  const acceptAffiliation = useProfessionalStore((s) => s.acceptAffiliation);
  const rejectAffiliation = useProfessionalStore((s) => s.rejectAffiliation);
  const user = useAuthStore((s) => s.user);
  const updateEmail = useAuthStore((s) => s.updateEmail);
  const updatePassword = useAuthStore((s) => s.updatePassword);

  // Convites de vinculacao recebidos do owner (type INVITATION, PENDING).
  const [invites, setInvites] = useState<any[]>([]);
  const [resolvingInvite, setResolvingInvite] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    try {
      const all = await fetchMyAffiliations();
      setInvites(
        (all ?? []).filter((a: any) => a.status === "PENDING" && a.type === "INVITATION")
      );
    } catch {}
  }, [fetchMyAffiliations]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const handleAcceptInvite = async (inv: any) => {
    setResolvingInvite(inv.id);
    try {
      await acceptAffiliation(inv.id);
      setInvites((prev) => prev.filter((i) => i.id !== inv.id));
      Alert.alert("Vinculado", `Voce agora esta vinculado a ${inv.establishmentName ?? "este estabelecimento"}.`);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel aceitar o convite."));
    } finally {
      setResolvingInvite(null);
    }
  };

  const handleRejectInvite = async (inv: any) => {
    setResolvingInvite(inv.id);
    try {
      await rejectAffiliation(inv.id);
      setInvites((prev) => prev.filter((i) => i.id !== inv.id));
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel recusar o convite."));
    } finally {
      setResolvingInvite(null);
    }
  };

  const [isLeaving, setIsLeaving] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const startEdit = (field: Editing) => {
    setFieldError(null);
    setName(field === "name" ? professional?.name ?? "" : "");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setEditing(field);
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

  const cancelEdit = () => {
    setEditing(null);
    setFieldError(null);
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

  const handleLeave = () => {
    Alert.alert(
      "Desafiliar do estabelecimento",
      `Voce deixara de atender em ${professional?.establishment_name ?? "este estabelecimento"} e nao recebera novos clientes na fila. Deseja continuar?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desafiliar",
          style: "destructive",
          onPress: async () => {
            setIsLeaving(true);
            try {
              await leaveEstablishment();
              Alert.alert(
                "Desafiliado",
                "Voce nao esta mais vinculado ao estabelecimento. Busque um novo estabelecimento quando quiser voltar a atender."
              );
            } catch (error: any) {
              Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel desafiliar do estabelecimento. Tente novamente."));
            } finally {
              setIsLeaving(false);
            }
          },
        },
      ]
    );
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
        <Header showBackButton onBack={() => router.navigate("/(professional)/profile" as any)} />

        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Configuracoes
        </Heading>

        {invites.length > 0 && (
          <VStack
            mt="$6"
            bg="$green50"
            p="$4"
            borderRadius="$lg"
            borderWidth="$1"
            borderColor="$green200"
            space="sm"
          >
            <Text fontFamily="$heading" fontWeight="$bold" color="$green700">
              Convites de vinculacao
            </Text>
            {invites.map((inv) => (
              <VStack key={inv.id} bg="$white" p="$3" borderRadius="$md" borderWidth="$1" borderColor="$coolGray200">
                <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
                  Convite de
                </Text>
                <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900" mb="$2">
                  {inv.establishmentName ?? "Estabelecimento"}
                </Text>
                <HStack space="sm">
                  <Button
                    title="Recusar"
                    onPress={() => handleRejectInvite(inv)}
                    isLoading={resolvingInvite === inv.id}
                    bg="transparent"
                    $active-bg="$red50"
                    borderWidth="$1"
                    borderColor="$red500"
                    textColor="$red500"
                    h="$9"
                    flex={1}
                  />
                  <Button
                    title="Aceitar"
                    onPress={() => handleAcceptInvite(inv)}
                    isLoading={resolvingInvite === inv.id}
                    bg="$green500"
                    $active-bg="$green600"
                    h="$9"
                    flex={1}
                  />
                </HStack>
              </VStack>
            ))}
          </VStack>
        )}

        <VStack mt="$6" space="md">
          <VStack bg="$white" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200">
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

          <VStack bg="$white" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200">
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

          <VStack bg="$white" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200">
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

          <Divider my="$2" />

          <VStack bg="$white" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200">
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
              Refeicoes (almoco/janta)
            </Text>
            <Text fontFamily="$body" fontSize="$xs" color="$coolGray500" mt="$1">
              Editar horario e duracao; entram no calculo da fila.
            </Text>
            <Button
              title="Gerenciar Refeicoes"
              onPress={() => router.push("/(professional)/meals" as any)}
              bg="$coolGray200"
              textColor="$coolGray700"
              h="$9"
              mt="$2"
            />
          </VStack>

          <VStack bg="$coolGray50" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200">
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
              Estabelecimento
            </Text>
            <Text fontFamily="$heading" fontWeight="$bold" color={professional?.establishment_name ? "$green700" : "$coolGray400"} mt="$1">
              {professional?.establishment_name ?? "Nao vinculado"}
            </Text>
            {!professional?.establishment_id ? (
              <Button
                title="Buscar Estabelecimento"
                onPress={() => router.push("/(professional)/find-establishment" as any)}
                bg="$green500"
                $active-bg="$green600"
                h="$9"
                mt="$2"
              />
            ) : (
              <Button
                title="Desafiliar do Estabelecimento"
                onPress={handleLeave}
                isLoading={isLeaving}
                bg="transparent"
                $active-bg="$red50"
                borderWidth="$1"
                borderColor="$red500"
                textColor="$red500"
                h="$9"
                mt="$2"
              />
            )}
          </VStack>
        </VStack>
      </VStack>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
