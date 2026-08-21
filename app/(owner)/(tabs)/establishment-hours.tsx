import { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { getApiErrorMessage } from "@lib/api";
import { maskTime, isValidTime, parseApiTime, toApiTime } from "@lib/time";

export default function EstablishmentHoursScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const updateGeneralInfos = useEstablishmentStore((s) => s.updateGeneralInfos);
  const fetchEstablishmentById = useEstablishmentStore((s) => s.fetchEstablishmentById);

  const [opening, setOpening] = useState(parseApiTime(establishment?.opening_time) ?? "");
  const [closing, setClosing] = useState(parseApiTime(establishment?.closing_time) ?? "");

  // QA 2026-07-22 (#4): a store persistida pode nao ter o horario (projecao
  // velha) — os campos abriam VAZIOS mesmo com horario ja configurado, e o
  // "Salvar" parecia indevido. Busca o detalhe FRESCO e preenche o que o
  // usuario ainda nao digitou (digitacao tem precedencia).
  useEffect(() => {
    if (!establishment?.id) return;
    let active = true;
    fetchEstablishmentById(establishment.id)
      .then((d) => {
        if (!active) return;
        setOpening((cur) => cur || (parseApiTime(d.opening_time) ?? ""));
        setClosing((cur) => cur || (parseApiTime(d.closing_time) ?? ""));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [establishment?.id, fetchEstablishmentById]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!establishment?.id) return;
    if (!isValidTime(opening) || !isValidTime(closing)) {
      Alert.alert("Horário inválido", "Informe abertura e fechamento no formato HH:MM (ex.: 09:00).");
      return;
    }
    if (opening >= closing) {
      Alert.alert("Horário inválido", "O fechamento deve ser depois da abertura.");
      return;
    }
    setIsSaving(true);
    try {
      await updateGeneralInfos(establishment.id, {
        opening_time: toApiTime(opening)!,
        closing_time: toApiTime(closing)!,
      });
      Alert.alert("Horário salvo", "O horário de funcionamento foi atualizado.");
      router.navigate("/(owner)/establishment-data" as any);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível salvar o horário."));
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
          title="Horário de funcionamento"
          onBack={() => router.navigate("/(owner)/establishment-data" as any)}
        />
          <Text className="font-body text-vupth-textSecondary mt-1">
            Necessario para abrir o estabelecimento. As refeições dos profissionais
            precisam caber nesse horário.
          </Text>

          <View className="mt-6 gap-3">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <NwInput
                  label="Abertura (HH:MM)"
                  placeholder="09:00"
                  value={opening}
                  onChangeText={(t) => setOpening(maskTime(t))}
                  keyboardType="number-pad"
                />
              </View>
              <View className="flex-1">
                <NwInput
                  label="Fechamento (HH:MM)"
                  placeholder="18:00"
                  value={closing}
                  onChangeText={(t) => setClosing(maskTime(t))}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <NwButton title="Salvar" onPress={handleSave} isLoading={isSaving} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
