import { useState } from "react";
import {
  VStack,
  HStack,
  FormControl,
  Heading,
  Text,
  ScrollView,
} from "@gluestack-ui/themed";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { Button } from "@components/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { getApiErrorMessage } from "@lib/api";

export default function EstablishmentRegistrationScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const updateGeneralInfos = useEstablishmentStore((s) => s.updateGeneralInfos);

  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = () => {
    setNameValue(establishment?.name ?? "");
    setEditing(true);
  };

  const handleSave = async () => {
    const value = nameValue.trim();
    if (value.length < 2 || !establishment?.id) {
      Alert.alert("Nome invalido", "Informe um nome valido para o estabelecimento.");
      return;
    }
    setIsSaving(true);
    try {
      await updateGeneralInfos(establishment.id, { name: value });
      setEditing(false);
      Alert.alert("Nome atualizado", "O nome do estabelecimento foi alterado.");
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel alterar o nome."));
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
          <Header showBackButton onBack={() => router.back()} />

          <Heading mt="$8" size="2xl" fontFamily="$heading">
            Dados Cadastrais
          </Heading>

          <VStack mt="$6" space="md">
            <VStack bg="$white" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200">
              <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
                Nome do estabelecimento
              </Text>
              {editing ? (
                <FormControl mt="$2">
                  <Input
                    textLabel="Novo nome"
                    placeholder="Nome do estabelecimento"
                    messageError=""
                    value={nameValue}
                    onChangeText={setNameValue}
                    autoCapitalize="words"
                  />
                  <HStack space="sm">
                    <Button
                      title="Cancelar"
                      onPress={() => setEditing(false)}
                      bg="$coolGray200"
                      textColor="$coolGray700"
                      h="$9"
                      flex={1}
                    />
                    <Button
                      title="Salvar"
                      onPress={handleSave}
                      isLoading={isSaving}
                      bg="$green500"
                      $active-bg="$green600"
                      h="$9"
                      flex={1}
                    />
                  </HStack>
                </FormControl>
              ) : (
                <>
                  <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900" mt="$1">
                    {establishment?.name ?? "—"}
                  </Text>
                  <Button
                    title="Editar"
                    onPress={startEdit}
                    bg="$coolGray200"
                    textColor="$coolGray700"
                    h="$9"
                    mt="$2"
                  />
                </>
              )}
            </VStack>
          </VStack>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
