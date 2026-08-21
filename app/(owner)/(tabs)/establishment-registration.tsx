import { useState } from "react";
import {
  VStack,
  HStack,
  FormControl,
  Text,
  ScrollView,
} from "@gluestack-ui/themed";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { Input } from "@components/Input";
import { Button } from "@components/Button";
import { BrandButton } from "@components/brand/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { getApiErrorMessage } from "@lib/api";
import { maskPhone, unmask } from "@lib/masks";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <>
      <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary" mt="$3">
        {label}
      </Text>
      <Text fontFamily="$heading" fontWeight="$bold" color={value ? "$forest" : "$brandTextSecondary"} mt="$0.5">
        {value || "—"}
      </Text>
    </>
  );
}

export default function EstablishmentRegistrationScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const updateGeneralInfos = useEstablishmentStore((s) => s.updateGeneralInfos);

  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [instagramValue, setInstagramValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = () => {
    setNameValue(establishment?.name ?? "");
    setPhoneValue(maskPhone(establishment?.phone ?? ""));
    setInstagramValue(establishment?.instagram ?? "");
    setEditing(true);
  };

  const handleSave = async () => {
    const name = nameValue.trim();
    if (name.length < 2 || !establishment?.id) {
      Alert.alert("Nome inválido", "Informe um nome valido para o estabelecimento.");
      return;
    }
    setIsSaving(true);
    try {
      // phone/instagram em branco LIMPAM o campo no backend (vira null) — comportamento desejado.
      await updateGeneralInfos(establishment.id, {
        name,
        phone: unmask(phoneValue),
        instagram: instagramValue.trim(),
      });
      setEditing(false);
      Alert.alert("Dados atualizados", "Os dados cadastrais foram alterados.");
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível salvar os dados."));
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
        <VStack flex={1} pb="$12" px="$4">
          <ScreenHeader
          title="Dados cadastrais"
          onBack={() => router.navigate("/(owner)/establishment-data" as any)}
        />

          <VStack mt="$6" space="md">
            <VStack bg="$brandSurface" p="$4" borderRadius="$card">
              {editing ? (
                <FormControl>
                  <Input
                    textLabel="Nome do estabelecimento"
                    placeholder="Nome do estabelecimento"
                    messageError=""
                    value={nameValue}
                    onChangeText={setNameValue}
                    autoCapitalize="words"
                  />
                  <Input
                    textLabel="Telefone (opcional)"
                    placeholder="(11) 99999-0000"
                    messageError=""
                    value={phoneValue}
                    onChangeText={(t) => setPhoneValue(maskPhone(t))}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                  />
                  <Input
                    textLabel="Instagram (opcional)"
                    placeholder="@seuestabelecimento"
                    messageError=""
                    value={instagramValue}
                    onChangeText={setInstagramValue}
                    autoCapitalize="none"
                  />
                  <HStack space="sm">
                    <Button
                      title="Cancelar"
                      onPress={() => setEditing(false)}
                      bg="$brandBorder"
                      textColor="$brandTextSecondary"
                      h="$9"
                      flex={1}
                    />
                    <BrandButton
                      title="Salvar"
                      onPress={handleSave}
                      isLoading={isSaving}
                      h="$9"
                      flex={1}
                    />
                  </HStack>
                </FormControl>
              ) : (
                <>
                  <Field label="Nome do estabelecimento" value={establishment?.name} />
                  <Field label="Telefone" value={establishment?.phone ? maskPhone(establishment.phone) : null} />
                  <Field label="Instagram" value={establishment?.instagram} />
                  <Button
                    title="Editar"
                    onPress={startEdit}
                    bg="$brandBorder"
                    textColor="$brandTextSecondary"
                    h="$9"
                    mt="$4"
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
