import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { useProfessionalStore } from "@store/professional.store";
import { useAttendanceStore } from "@store/attendance.store";
import { getApiErrorMessage } from "@lib/api";
import { avisar } from "@lib/confirmar";

export default function AddGuestScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  const myServices = useProfessionalStore((s) => s.myServices);
  const fetchMyServices = useProfessionalStore((s) => s.fetchMyServices);
  const addGuestAttendance = useAttendanceStore((s) => s.addGuestAttendance);
  const queryClient = useQueryClient();

  const [clientName, setClientName] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMyServices();
    // carga on-mount unica; fetchMyServices e estavel (Zustand).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const selectedTotal = myServices
    .filter((s) => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  const handleSubmit = async () => {
    if (!clientName.trim() || selectedServices.length === 0) {
      setIsInvalid(true);
      return;
    }

    if (!professional?.id || !professional.establishment_id) {
      Alert.alert("Erro", "Profissional não vinculado a um estabelecimento.");
      return;
    }

    setIsInvalid(false);
    setIsLoading(true);

    try {
      await addGuestAttendance({
        professionalId: professional.id,
        establishmentId: professional.establishment_id,
        serviceItemIds: selectedServices,
        clientName: clientName.trim(),
      });
      // A Fila so ouvia o WS (e o refetch de 60s): com o socket atrasado, o
      // avulso nao aparecia ao voltar (bateria 09.11). Recarrega na hora.
      queryClient.invalidateQueries({
        queryKey: ["professionals-with-queue", professional.establishment_id],
      });
      // O cliente JA entrou na fila. Sem a caixa na web a tela nao fechava, e
      // o profissional adicionava de novo — cliente duplicado na fila.
      await avisar({
        titulo: "Adicionado",
        mensagem: `${clientName.trim()} entrou na fila.`,
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível adicionar o cliente."));
    } finally {
      setIsLoading(false);
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
          title="Adicionar cliente"
          onBack={() => router.navigate("/(professional)/queue" as any)}
        />
        <Text className="font-body text-vupth-textSecondary mt-1">
          Cliente sem cadastro no app
        </Text>

        <View className="mt-6">
          <NwInput
            label="Nome do cliente"
            placeholder="Ex: Maria"
            value={clientName}
            onChangeText={setClientName}
            error={isInvalid && !clientName.trim() ? "Nome obrigatório" : ""}
            testID="guest-name"
          />

          <Text className="font-body text-vupth-textSecondary mt-2 mb-2">
            Serviços ({selectedServices.length} selecionado{selectedServices.length !== 1 ? "s" : ""})
          </Text>

          {myServices.length === 0 && (
            <Text className="font-body text-sm text-vupth-textSecondary">
              Nenhum serviço cadastrado. Adicione serviços primeiro.
            </Text>
          )}

          <View className="gap-1 mb-4">
            {myServices.map((svc) => {
              const isSelected = selectedServices.includes(svc.id);
              return (
                <Pressable
                  key={svc.id}
                  onPress={() => toggleService(svc.id)}
                  accessibilityRole="button"
                  accessibilityLabel={svc.customName}
                  accessibilityState={{ selected: isSelected }}
                  className={`py-3 px-4 rounded-md border ${
                    isSelected ? "bg-vupth-selecionado border-vupth-selecionado" : "bg-vupth-surface border-vupth-border"
                  }`}
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text
                        className={`font-body text-sm ${isSelected ? "text-vupth-onSelecionadoBranco" : "text-vupth-textSecondary"}`}
                      >
                        {svc.customName}
                      </Text>
                      <Text
                        className={`font-body text-xs ${isSelected ? "text-vupth-greenTint" : "text-vupth-textSecondary"}`}
                      >
                        {svc.estimatedMinutes}min
                      </Text>
                    </View>
                    <Text
                      className={`font-heading ${isSelected ? "text-vupth-onSelecionadoBranco" : "text-vupth-textPrimary"}`}
                    >
                      R$ {svc.price.toFixed(2)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {selectedServices.length > 0 && (
            <View className="bg-vupth-greenTint p-3 rounded-md border border-vupth-onGreenTint flex-row justify-between items-center mb-4">
              <Text className="font-body text-vupth-onGreenTint">Total:</Text>
              <Text className="font-heading text-lg text-vupth-onGreenTint">
                R$ {selectedTotal.toFixed(2)}
              </Text>
            </View>
          )}

          {isInvalid && (
            <Text className="font-body text-sm text-vupth-danger mb-2">
              Informe o nome e selecione ao menos 1 serviço.
            </Text>
          )}

          <NwButton
            title="Adicionar na Fila"
            onPress={handleSubmit}
            isLoading={isLoading}
          />

          <NwButton
            title="Cancelar"
            onPress={() => router.back()}
            variant="secondary"
            className="mt-2"
          />
        </View>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
