import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { EditorDeHorarios } from "@components/EditorDeHorarios";
import { useProfessionalStore } from "@store/professional.store";
import {
  buscarAgenda,
  salvarSemanaDaAgenda,
  salvarDataDaAgenda,
  removerDataDaAgenda,
} from "@lib/horariosApi";
import { semanaDosProximosDias } from "@lib/horarioSemanal";

// agenda-do-profissional (Andre, 05/10): cada profissional monta a propria
// grade — os dias e as horas em que atende, dentro do horario da loja — e e ela
// que o Client oferece para agendar. So o proprio edita; o dono nao edita a
// dos outros. Sem grade cadastrada, vale o horario da loja, como antes.
// O mesmo editor do horario da loja (EditorDeHorarios).
export default function AgendaScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  const id = professional?.id ?? null;

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
            title="Minha agenda"
            subtitle="Os dias e horários em que você atende. O cliente só agenda dentro deles."
            onBack={() => router.navigate("/(professional)/settings" as any)}
          />
          <EditorDeHorarios
            chave={id}
            chamadas={{
              buscar: () => buscarAgenda(id!),
              salvarSemana: salvarSemanaDaAgenda,
              salvarData: salvarDataDaAgenda,
              removerData: removerDataDaAgenda,
            }}
            semanaSemCadastro={(h) => semanaDosProximosDias(h.upcoming)}
            semRota={
              <Text className="font-body text-vupth-textSecondary mt-4">
                A agenda própria ainda não chegou ao servidor. Por enquanto vale o horário da loja.
              </Text>
            }
            avisoSemCadastro="Você ainda não montou a sua agenda: por enquanto vale o horário da loja. Ajuste os dias e horários e salve."
            textoDaSemana="Vale para todas as semanas e tem de caber no horário da loja. Dia fechado: o cliente não agenda com você nesse dia."
            mensagemSemanaSalva="A sua agenda da semana foi atualizada."
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
