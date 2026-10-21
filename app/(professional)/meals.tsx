import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { LinhaComInterruptor } from "@components/LinhaComInterruptor";
import { useProfessionalStore } from "@store/professional.store";
import { useIntervalStore, mealName, type Interval } from "@store/interval.store";
import { getApiErrorMessage } from "@lib/api";
import { maskTime, isValidTime, parseApiTime, toApiTime } from "@lib/time";
import { isMealNudgeDisabled, setMealNudgeDisabled } from "@lib/mealNudge";
import { confirmar } from "@lib/confirmar";

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
  const startNextInterval = useIntervalStore((s) => s.startNextInterval);

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
      Alert.alert("Duração inválida", "Informe a duração em minutos (1 a 240).");
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

  // Modelo B: "Iniciar refeicao" comeca a proxima nao feita, nao pulada e nao
  // suprimida — quem escolhe e o backend (almoco suprimido as 17:30 -> janta).
  const temRefeicaoAtiva = meals.some((m) => m.status === "ACTIVE");
  const [iniciando, setIniciando] = useState(false);
  const handleStartNext = async () => {
    setIniciando(true);
    try {
      await startNextInterval(profId);
    } catch (error: any) {
      const nenhuma = error?.response?.status === 409;
      Alert.alert(
        nenhuma ? "Nenhuma refeição para iniciar" : "Erro",
        nenhuma
          ? "As refeições de hoje já foram feitas, puladas ou passaram do horário."
          : getApiErrorMessage(error, "Não foi possível iniciar a refeição.")
      );
    } finally {
      setIniciando(false);
    }
  };

  const handleRemove = async (m: Interval) => {
    const ok = await confirmar({
      titulo: "Remover refeição",
      mensagem: `Deseja remover "${mealName(m.description)}"? Você pode recriá-la depois.`,
      confirmar: "Remover",
      destrutivo: true,
    });
    if (!ok) return;

      try {
        await deleteInterval(profId, m.intervalId);
        if (editingId === m.intervalId) setEditingId(null);
      } catch (error: any) {
        Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível remover a refeição."));
      }
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
      Alert.alert("Duração inválida", "Informe a duração em minutos (1 a 240).");
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
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="flex-1 pb-12 px-4">
          <ScreenHeader
            title="Refeições"
            subtitle="Entram no cálculo da fila. O horário é previsão — a refeição começa quando você inicia (aqui ou no aviso da fila)."
            onBack={() => router.navigate(backTarget as any)}
          />

          <View className="mt-6 gap-2">
            {meals.map((m) =>
              editingId === m.intervalId ? (
                <View
                  key={m.intervalId}
                  className="bg-vupth-surface p-3 rounded-md border border-vupth-textPrimary"
                >
                  <Text className="font-heading text-vupth-textPrimary mb-2">{mealName(m.description)}</Text>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <NwInput
                        label="Horário (HH:MM)"
                        placeholder="12:00"
                        value={editTime}
                        onChangeText={(t) => setEditTime(maskTime(t))}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View className="flex-1">
                      <NwInput
                        label="Duração (min)"
                        placeholder="60"
                        value={editDuration}
                        onChangeText={(t) => setEditDuration(t.replace(/\D/g, "").slice(0, 3))}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                  <View className="flex-row gap-2 mt-1">
                    <NwButton
                      title="Cancelar"
                      variant="secondaryPainel"
                      onPress={() => setEditingId(null)}
                      className="flex-1"
                    />
                    <NwButton
                      title="Salvar"
                      onPress={() => handleSaveEdit(m.intervalId)}
                      isLoading={isSaving}
                      className="flex-1"
                    />
                  </View>
                </View>
              ) : (
                <View
                  key={m.intervalId}
                  className="flex-row items-center justify-between bg-vupth-surface p-3 rounded-card"
                >
                  <View className="flex-1">
                    <Text className="font-heading text-vupth-textPrimary">{mealName(m.description)}</Text>
                    <Text className="font-body text-xs text-vupth-textSecondary">
                      {parseApiTime(m.fixedStartTime) ?? "--:--"} • {m.durationMinutes}min •{" "}
                      {patternLabel(m.recurrencePattern)}
                      {m.status === "ACTIVE" ? " • em andamento" : ""}
                      {/* Modelo B: passou do inicio maximo sem iniciar -> saiu do dia. */}
                      {m.suppressedToday ? " • hoje passou do horário" : ""}
                    </Text>
                    <View className="flex-row gap-3 mt-1">
                      <Pressable onPress={() => startEdit(m)} accessibilityRole="button" hitSlop={6}>
                        <Text className="font-body text-xs text-vupth-textPrimary">Editar</Text>
                      </Pressable>
                      <Pressable onPress={() => handleRemove(m)} accessibilityRole="button" hitSlop={6}>
                        <Text className="font-body text-xs text-vupth-danger">Remover</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )
            )}

            {meals.length === 0 && (
              <Text className="font-body text-vupth-textSecondary text-center mt-2">
                Nenhuma refeição cadastrada
              </Text>
            )}
          </View>

          {/* Os dois botoes sao irmaos: um grupo com `gap-3`. Cada um com o
              proprio `mt-6` dava 24 px ENTRE eles (validacao de 17/10) — o
              mesmo espaco que separa blocos de assuntos diferentes. */}
          {((!temRefeicaoAtiva && meals.length > 0) || !showAdd) && (
            <View className="mt-6 gap-3">
              {!temRefeicaoAtiva && meals.length > 0 && (
                <NwButton title="Iniciar refeição agora" onPress={handleStartNext} isLoading={iniciando} />
              )}
              {!showAdd && (
                <NwButton
                  title="Adicionar refeição"
                  variant="secondary"
                  onPress={() => {
                    setEditingId(null);
                    setShowAdd(true);
                  }}
                />
              )}
            </View>
          )}

          {showAdd && (
            <View className="mt-6">
              <View className="h-px bg-vupth-border mb-4" />
              <Text className="font-heading text-xl text-vupth-textPrimary mb-3">Nova Refeição</Text>
              <NwInput label="Nome" placeholder="Ex: Almoço" value={addDesc} onChangeText={setAddDesc} />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <NwInput
                    label="Horário (HH:MM)"
                    placeholder="12:00"
                    value={addTime}
                    onChangeText={(t) => setAddTime(maskTime(t))}
                    keyboardType="number-pad"
                  />
                </View>
                <View className="flex-1">
                  <NwInput
                    label="Duração (min)"
                    placeholder="60"
                    value={addDuration}
                    onChangeText={(t) => setAddDuration(t.replace(/\D/g, "").slice(0, 3))}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Text className="font-body text-sm text-vupth-textSecondary mb-2">Recorrencia</Text>
              <View className="flex-row flex-wrap gap-1 mb-4">
                {PATTERNS.map((p) => {
                  const selected = addPattern === p.value;
                  return (
                    <Pressable
                      key={p.value}
                      onPress={() => setAddPattern(p.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      className={`py-1.5 px-3 rounded-full border mb-1 ${
                        selected ? "bg-vupth-selecionado border-vupth-selecionado" : "bg-vupth-background border-vupth-border"
                      }`}
                    >
                      <Text
                        className={`font-body text-xs ${selected ? "text-vupth-onSelecionadoBranco" : "text-vupth-textSecondary"}`}
                      >
                        {p.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <NwButton title="Adicionar" onPress={handleAdd} isLoading={isSaving} className="mt-4" />
              {/* Cancelar e a metade negativa de uma escolha, nao destruicao:
                  vai de `secondary` (regra do NwButton), nao de vermelho. */}
              <NwButton
                title="Cancelar"
                variant="secondary"
                onPress={() => setShowAdd(false)}
                className="mt-3"
              />
            </View>
          )}

          <View className="mt-4">
            <LinhaComInterruptor
              rotulo="Aviso na hora da refeição"
              testID="interruptor-aviso-refeicao"
              descricao={
                mealNudgeOff
                  ? "Desligado — o lembrete aparece só nas Opções da fila (bolinha + contagem)."
                  : "Ligado — um aviso aparece na tela no horário da refeição."
              }
              ligado={!mealNudgeOff}
              onMudar={(ligado) => {
                if (ligado === mealNudgeOff) toggleMealNudge();
              }}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
