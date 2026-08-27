import { useState, useEffect, useCallback } from "react";
import {
  VStack,
  HStack,
  FormControl,
  Heading,
  Text,
  Pressable,
  Divider,
  ScrollView,
} from "@gluestack-ui/themed";
import { Alert, KeyboardAvoidingView, Platform, RefreshControl } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { Input } from "@components/Input";
import { Button } from "@components/Button";
import { BrandButton } from "@components/brand/Button";
import { useProfessionalStore } from "@store/professional.store";
import { useIntervalStore, mealName, type Interval } from "@store/interval.store";
import { getApiErrorMessage } from "@lib/api";
import { maskTime, isValidTime, parseApiTime, toApiTime } from "@lib/time";
import { isMealNudgeDisabled, setMealNudgeDisabled } from "@lib/mealNudge";

const PATTERNS = [
  { label: "Dias uteis", value: "WEEKDAYS" },
  { label: "Todos os dias", value: "DAILY" },
  { label: "Fins de semana", value: "WEEKENDS" },
];

function patternLabel(value: string | null): string {
  return PATTERNS.find((p) => p.value === value)?.label ?? value ?? "";
}

export default function MealsScreen() {
  // Aviso na hora da refeicao (nav v2: o liga/desliga mora AQUI, junto das
  // refeicoes — antes ficava perdido em Configuracoes). Reversao do "Nao ver
  // mais" do popup; sem isto seria beco sem saida.
  const [mealNudgeOff, setMealNudgeOff] = useState(false);
  useEffect(() => {
    isMealNudgeDisabled().then(setMealNudgeOff).catch(() => {});
  }, []);
  const toggleMealNudge = async () => {
    const next = !mealNudgeOff;
    setMealNudgeOff(next);
    try {
      await setMealNudgeDisabled(next);
    } catch {
      setMealNudgeOff(!next); // não mentir na UI se a gravacao falhar
    }
  };

  // Voltar retorna a ORIGEM real (Configuracoes ou Opcoes da fila). Sem isto o
  // botao caia sempre na Fila (feedback Andre 2026-07-24). Tabs href:null nao
  // dao router.back() confiavel, entao o chamador informa `from`.
  const { from } = useLocalSearchParams<{ from?: string }>();
  const backTarget =
    from === "queue-options"
      ? "/(professional)/queue-options"
      : from === "queue"
        ? "/(professional)/queue"
        : "/(professional)/settings";

  const professional = useProfessionalStore((s) => s.professional);
  const profId = professional?.id ?? "";

  const intervals = useIntervalStore((s) => s.intervals);
  const fetchIntervals = useIntervalStore((s) => s.fetchIntervals);
  const updateInterval = useIntervalStore((s) => s.updateInterval);
  const deleteInterval = useIntervalStore((s) => s.deleteInterval);
  const createRecurring = useIntervalStore((s) => s.createRecurring);

  const meals = intervals.filter((i) => i.type === "RECURRENT");

  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addDesc, setAddDesc] = useState("");
  const [addTime, setAddTime] = useState("");
  const [addDuration, setAddDuration] = useState("");
  const [addPattern, setAddPattern] = useState("WEEKDAYS");

  const load = useCallback(async () => {
    if (!profId) return;
    try {
      await fetchIntervals(profId);
    } catch {}
  }, [profId, fetchIntervals]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const startEdit = (m: Interval) => {
    setShowAdd(false);
    setEditingId(m.intervalId);
    setEditTime(parseApiTime(m.fixedStartTime) ?? "");
    setEditDuration(String(m.durationMinutes));
  };

  const handleSaveEdit = async (intervalId: string) => {
    const duration = parseInt(editDuration, 10);
    if (!isValidTime(editTime)) {
      Alert.alert("Horário inválido", "Use o formato HH:MM (ex.: 12:00).");
      return;
    }
    if (isNaN(duration) || duration <= 0 || duration > 240) {
      Alert.alert("Duracao inválida", "Informe a duracao em minutos (1 a 240).");
      return;
    }
    setIsSaving(true);
    try {
      await updateInterval(profId, intervalId, {
        fixedStartTime: toApiTime(editTime)!,
        durationMinutes: duration,
      });
      setEditingId(null);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível salvar a refeição."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = (m: Interval) => {
    Alert.alert(
      "Remover refeição",
      `Deseja remover "${mealName(m.description)}"? Você pode recriá-la depois.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteInterval(profId, m.intervalId);
              if (editingId === m.intervalId) setEditingId(null);
            } catch (error: any) {
              Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível remover a refeição."));
            }
          },
        },
      ]
    );
  };

  const handleAdd = async () => {
    const duration = parseInt(addDuration, 10);
    if (!addDesc.trim()) {
      Alert.alert("Nome obrigatório", "Informe o nome da refeição (ex.: Almoço).");
      return;
    }
    if (!isValidTime(addTime)) {
      Alert.alert("Horário inválido", "Use o formato HH:MM (ex.: 12:00).");
      return;
    }
    if (isNaN(duration) || duration <= 0 || duration > 240) {
      Alert.alert("Duracao inválida", "Informe a duracao em minutos (1 a 240).");
      return;
    }
    setIsSaving(true);
    try {
      await createRecurring(profId, {
        description: addDesc.trim(),
        fixedStartTime: toApiTime(addTime)!,
        durationMinutes: duration,
        recurrencePattern: addPattern,
      });
      setShowAdd(false);
      setAddDesc("");
      setAddTime("");
      setAddDuration("");
      setAddPattern("WEEKDAYS");
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível adicionar a refeição."));
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <VStack flex={1} pb="$12" px="$4">
          <ScreenHeader
            title="Refeições"
            subtitle="Entram no cálculo da fila. O horário é previsão — você inicia a refeição na tela da fila."
            onBack={() => router.navigate(backTarget as any)}
          />

          <VStack mt="$6" space="sm">
            {meals.map((m) =>
              editingId === m.intervalId ? (
                <VStack
                  key={m.intervalId}
                  bg="$brandSurface"
                  p="$3"
                  borderRadius="$md"
                  borderWidth="$1"
                  borderColor="$forest"
                >
                  <Text fontFamily="$heading" fontWeight="$bold" color="$forest" mb="$2">
                    {mealName(m.description)}
                  </Text>
                  <FormControl>
                    <HStack space="md">
                      <VStack flex={1}>
                        <Input
                          textLabel="Horário (HH:MM)"
                          placeholder="12:00"
                          messageError=""
                          value={editTime}
                          onChangeText={(t) => setEditTime(maskTime(t))}
                          keyboardType="number-pad"
                        />
                      </VStack>
                      <VStack flex={1}>
                        <Input
                          textLabel="Duracao (min)"
                          placeholder="60"
                          messageError=""
                          value={editDuration}
                          onChangeText={(t) => setEditDuration(t.replace(/\D/g, "").slice(0, 3))}
                          keyboardType="number-pad"
                        />
                      </VStack>
                    </HStack>
                  </FormControl>
                  <HStack space="sm" mt="$1">
                    <Button
                      title="Cancelar"
                      onPress={() => setEditingId(null)}
                      bg="$brandBorder"
                      textColor="$brandTextSecondary"
                      h="$9"
                      flex={1}
                    />
                    <BrandButton
                      title="Salvar"
                      onPress={() => handleSaveEdit(m.intervalId)}
                      isLoading={isSaving}
                      h="$9"
                      flex={1}
                    />
                  </HStack>
                </VStack>
              ) : (
                <HStack
                  key={m.intervalId}
                  bg="$brandSurface"
                  p="$3"
                  borderRadius="$card"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <VStack flex={1}>
                    <Text fontFamily="$heading" fontWeight="$bold" color="$forest">
                      {mealName(m.description)}
                    </Text>
                    <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary">
                      {parseApiTime(m.fixedStartTime) ?? "--:--"} • {m.durationMinutes}min •{" "}
                      {patternLabel(m.recurrencePattern)}
                      {m.status === "ACTIVE" ? " • em andamento" : ""}
                    </Text>
                    <HStack space="md" mt="$1">
                      <Pressable onPress={() => startEdit(m)}>
                        <Text fontFamily="$body" fontSize="$xs" color="$forest">
                          Editar
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => handleRemove(m)}>
                        <Text fontFamily="$body" fontSize="$xs" color="$brandDanger">
                          Remover
                        </Text>
                      </Pressable>
                    </HStack>
                  </VStack>
                </HStack>
              )
            )}

            {meals.length === 0 && (
              <Text fontFamily="$body" color="$brandTextSecondary" textAlign="center" mt="$2">
                Nenhuma refeição cadastrada
              </Text>
            )}
          </VStack>

          {!showAdd ? (
            <BrandButton title="Adicionar refeição" onPress={() => { setEditingId(null); setShowAdd(true); }} mt="$6" />
          ) : (
            <VStack mt="$6">
              <Divider mb="$4" />
              <Heading size="lg" fontFamily="$heading" mb="$3">
                Nova Refeição
              </Heading>
              <FormControl>
                <Input
                  textLabel="Nome"
                  placeholder="Ex: Almoço"
                  messageError=""
                  value={addDesc}
                  onChangeText={setAddDesc}
                />
                <HStack space="md">
                  <VStack flex={1}>
                    <Input
                      textLabel="Horário (HH:MM)"
                      placeholder="12:00"
                      messageError=""
                      value={addTime}
                      onChangeText={(t) => setAddTime(maskTime(t))}
                      keyboardType="number-pad"
                    />
                  </VStack>
                  <VStack flex={1}>
                    <Input
                      textLabel="Duracao (min)"
                      placeholder="60"
                      messageError=""
                      value={addDuration}
                      onChangeText={(t) => setAddDuration(t.replace(/\D/g, "").slice(0, 3))}
                      keyboardType="number-pad"
                    />
                  </VStack>
                </HStack>
              </FormControl>

              <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary" mb="$2">
                Recorrencia
              </Text>
              <HStack space="xs" mb="$4" flexWrap="wrap">
                {PATTERNS.map((p) => {
                  const selected = addPattern === p.value;
                  return (
                    <Pressable
                      key={p.value}
                      onPress={() => setAddPattern(p.value)}
                      bg={selected ? "$forest" : "$white"}
                      py="$1.5"
                      px="$3"
                      borderRadius="$full"
                      borderWidth="$1"
                      borderColor={selected ? "$forest" : "$brandBorder"}
                      mb="$1"
                    >
                      <Text fontFamily="$body" fontSize="$xs" color={selected ? "$white" : "$brandTextSecondary"}>
                        {p.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </HStack>

              <BrandButton title="Adicionar" onPress={handleAdd} isLoading={isSaving} mt="$9" />
              <Button
                title="Cancelar"
                onPress={() => setShowAdd(false)}
                bg="transparent"
                $active-bg="$brandSurface"
                borderWidth="$1"
                borderColor="$brandDanger"
                textColor="$brandDanger"
              />
            </VStack>
          )}

          <VStack bg="$brandSurface" p="$4" borderRadius="$card" mt="$4">
            <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary">
              Aviso na hora da refeição
            </Text>
            <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary" mt="$1">
              {mealNudgeOff
                ? "Desligado — o lembrete aparece só nas Opções da fila (bolinha + contagem)."
                : "Ligado — um aviso aparece na tela no horário da refeição."}
            </Text>
            <Button
              title={mealNudgeOff ? "Ligar aviso" : "Desligar aviso"}
              onPress={toggleMealNudge}
              bg="$brandBorder"
              textColor="$brandTextSecondary"
              h="$9"
              mt="$2"
            />
          </VStack>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
