import { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { EditorDeHorarios } from "@components/EditorDeHorarios";
import { useEstablishmentStore } from "@store/establishment.store";
import { getApiErrorMessage } from "@lib/api";
import { maskTime, isValidTime, parseApiTime, toApiTime } from "@lib/time";
import { buscarHorarios, salvarSemana, salvarData, removerData } from "@lib/horariosApi";

const VOLTAR = "/(owner)/establishment-data";

// 🚀 Horario POR DIA (S27, bloqueio de lancamento). Era um par unico para a
// semana inteira — nao dava para dizer "domingo fechado" nem "sabado ate o
// meio-dia". Agora: a semana (os 7 dias, sempre definidos) e as DATAS
// ESPECIAIS (feriado, um dia com horario diferente). "Todas as segundas" vai no
// PUT da semana; "so nesta segunda" vira excecao da data. O passado e
// documento: so se define de hoje em diante.
//
// Backend sem a rota nova (404) -> o formulario antigo, de horario unico, que
// continua aceito e passa a valer para os 7 dias. O app nao depende da ordem
// dos deploys.
export default function EstablishmentHoursScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const id = establishment?.id ?? null;

  const opens = parseApiTime(establishment?.opening_time);
  const closes = parseApiTime(establishment?.closing_time);
  const legado = opens && closes ? { opens, closes } : null;

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
            onBack={() => router.navigate(VOLTAR as any)}
          />
          <EditorDeHorarios
            chave={id}
            chamadas={{
              buscar: () => buscarHorarios(id!),
              salvarSemana: (dias) => salvarSemana(id!, dias),
              salvarData: (dataIso, h) => salvarData(id!, dataIso, h),
              removerData: (dataIso) => removerData(id!, dataIso),
            }}
            semente={legado}
            semRota={<HorarioUnico />}
            avisoSemCadastro="Defina o horário de cada dia da semana. Ele é necessário para abrir o estabelecimento, e as refeições dos profissionais precisam caber nele."
            textoDaSemana="Vale para todas as semanas. Fechar depois de abrir (22:00 às 02:00) vira o dia; abrir e fechar no mesmo horário é 24 horas."
            mensagemSemanaSalva="O horário da semana foi atualizado."
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// O formulario de antes (um horario para a semana inteira). Fica so para o
// backend que ainda nao tem a rota da semana.
function HorarioUnico() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const updateGeneralInfos = useEstablishmentStore((s) => s.updateGeneralInfos);
  const fetchEstablishmentById = useEstablishmentStore((s) => s.fetchEstablishmentById);

  const [opening, setOpening] = useState(parseApiTime(establishment?.opening_time) ?? "");
  const [closing, setClosing] = useState(parseApiTime(establishment?.closing_time) ?? "");
  const [isSaving, setIsSaving] = useState(false);

  // QA 2026-07-22 (#4): a store persistida pode nao ter o horario — busca o
  // detalhe FRESCO e preenche o que o usuario ainda nao digitou.
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
      router.navigate(VOLTAR as any);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível salvar o horário."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Text className="font-body text-vupth-textSecondary mt-1">
        Necessario para abrir o estabelecimento. As refeições dos profissionais precisam caber nesse
        horário.
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
    </>
  );
}
