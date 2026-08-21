import { useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { ScreenHeader, defaultBack } from "@components/ScreenHeader";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";

export default function ServicesScreen() {
  const [isInvalid] = useState(false);

  const handleFinish = () => {
    // TODO: chamar API para criar serviços, depois redirecionar ao dashboard
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
            title="Serviços oferecidos"
            subtitle="O que você faz, quanto custa e quanto demora."
            onBack={defaultBack}
          />

          <View className="flex-1 px-4 w-full">

            <NwInput
              label="Nome do Serviço"
              placeholder="Corte Degradê"
              error={isInvalid ? "Campo obrigatório" : ""}
            />

            <NwInput
              label="Preço"
              placeholder="35.00"
              keyboardType="decimal-pad"
              error={isInvalid ? "Preço inválido" : ""}
            />

            <NwInput
              label="Duração Estimada (min)"
              placeholder="30"
              keyboardType="number-pad"
              error={isInvalid ? "Duração inválida" : ""}
            />

            <NwButton title="Finalizar Cadastro" onPress={handleFinish} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
