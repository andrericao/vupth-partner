import { useState, useEffect } from "react";
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
      Alert.alert("Horario invalido", "Informe abertura e fechamento no formato HH:MM (ex.: 09:00).");
      return;
    }
    if (opening >= closing) {
      Alert.alert("Horario invalido", "O fechamento deve ser depois da abertura.");
      return;
    }
    setIsSaving(true);
    try {
      await updateGeneralInfos(establishment.id, {
        opening_time: toApiTime(opening)!,
        closing_time: toApiTime(closing)!,
      });
      Alert.alert("Horario salvo", "O horario de funcionamento foi atualizado.");
      router.navigate("/(owner)/establishment-data" as any);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel salvar o horario."));
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
          <Header
            showBackButton
            onBack={() => router.navigate("/(owner)/establishment-data" as any)}
          />

          <Heading mt="$8" size="2xl" fontFamily="$heading">
            Horario de Funcionamento
          </Heading>
          <Text fontFamily="$body" color="$coolGray500" mt="$1">
            Necessario para abrir o estabelecimento. As refeicoes dos profissionais
            precisam caber nesse horario.
          </Text>

          <VStack mt="$6" space="md">
            <FormControl>
              <HStack space="md">
                <VStack flex={1}>
                  <Input
                    textLabel="Abertura (HH:MM)"
                    placeholder="09:00"
                    messageError=""
                    value={opening}
                    onChangeText={(t) => setOpening(maskTime(t))}
                    keyboardType="number-pad"
                  />
                </VStack>
                <VStack flex={1}>
                  <Input
                    textLabel="Fechamento (HH:MM)"
                    placeholder="18:00"
                    messageError=""
                    value={closing}
                    onChangeText={(t) => setClosing(maskTime(t))}
                    keyboardType="number-pad"
                  />
                </VStack>
              </HStack>
            </FormControl>

            <Button title="Salvar" onPress={handleSave} isLoading={isSaving} />
          </VStack>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
