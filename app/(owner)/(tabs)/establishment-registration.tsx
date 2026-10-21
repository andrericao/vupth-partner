import { useState } from "react";
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { getApiErrorMessage } from "@lib/api";
import { maskPhone, unmask } from "@lib/masks";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <>
      <Text className="font-body text-sm text-vupth-textSecondary mt-3">{label}</Text>
      <Text
        className={`font-heading mt-0.5 ${value ? "text-vupth-textPrimary" : "text-vupth-textSecondary"}`}
      >
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
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 pb-12 px-4">
          <ScreenHeader
            title="Dados cadastrais"
            onBack={() => router.navigate("/(owner)/establishment-data" as any)}
          />

          <View className="mt-6 bg-vupth-surface p-4 rounded-card">
            {editing ? (
              <>
                <NwInput
                  label="Nome do estabelecimento"
                  placeholder="Nome do estabelecimento"
                  value={nameValue}
                  onChangeText={setNameValue}
                  autoCapitalize="words"
                />
                <NwInput
                  label="Telefone (opcional)"
                  placeholder="(11) 99999-0000"
                  value={phoneValue}
                  onChangeText={(t) => setPhoneValue(maskPhone(t))}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
                <NwInput
                  label="Instagram (opcional)"
                  placeholder="@seuestabelecimento"
                  value={instagramValue}
                  onChangeText={setInstagramValue}
                  autoCapitalize="none"
                />
                <View className="flex-row gap-2">
                  <NwButton
                    title="Cancelar"
                    onPress={() => setEditing(false)}
                    variant="secondaryPainel"
                    className="flex-1 h-9 mt-0"
                  />
                  <NwButton
                    title="Salvar"
                    onPress={handleSave}
                    isLoading={isSaving}
                    className="flex-1 h-9 mt-0"
                  />
                </View>
              </>
            ) : (
              <>
                <Field label="Nome do estabelecimento" value={establishment?.name} />
                <Field
                  label="Telefone"
                  value={establishment?.phone ? maskPhone(establishment.phone) : null}
                />
                <Field label="Instagram" value={establishment?.instagram} />
                <NwButton
                  title="Editar"
                  onPress={startEdit}
                  variant="secondary"
                  className="h-9 mt-4"
                />
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
