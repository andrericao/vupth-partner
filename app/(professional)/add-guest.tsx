import { useState, useEffect } from "react";
import {
  VStack,
  HStack,
  FormControl,
  Heading,
  ScrollView,
  Text,
  Pressable,
} from "@gluestack-ui/themed";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { Button } from "@components/Button";
import { useProfessionalStore } from "@store/professional.store";
import { useAttendanceStore } from "@store/attendance.store";
import { getApiErrorMessage } from "@lib/api";

type ServiceItem = {
  id: string;
  serviceItemType: string;
  customName: string;
  price: number;
  estimatedMinutes: number;
};

export default function AddGuestScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  const myServices = useProfessionalStore((s) => s.myServices);
  const fetchMyServices = useProfessionalStore((s) => s.fetchMyServices);
  const addGuestAttendance = useAttendanceStore((s) => s.addGuestAttendance);

  const [clientName, setClientName] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMyServices();
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
      Alert.alert("Erro", "Profissional nao vinculado a um estabelecimento.");
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
      Alert.alert("Adicionado", `${clientName.trim()} entrou na fila.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel adicionar o cliente."));
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
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton onBack={() => router.navigate("/(professional)/queue" as any)} />

        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Adicionar Cliente
        </Heading>
        <Text fontFamily="$body" color="$coolGray500" mt="$1">
          Cliente sem cadastro no app
        </Text>

        <FormControl isInvalid={isInvalid} mt="$6">
          <Input
            textLabel="Nome do cliente"
            placeholder="Ex: Maria"
            messageError="Nome obrigatorio"
            value={clientName}
            onChangeText={setClientName}
            testID="guest-name"
          />

          <Text fontFamily="$body" mb="$2" mt="$2" color="$coolGray600">
            Servicos ({selectedServices.length} selecionado{selectedServices.length !== 1 ? "s" : ""})
          </Text>

          {myServices.length === 0 && (
            <Text fontFamily="$body" color="$coolGray400" fontSize="$sm">
              Nenhum servico cadastrado. Adicione servicos primeiro.
            </Text>
          )}

          <VStack space="xs" mb="$4">
            {myServices.map((svc) => {
              const isSelected = selectedServices.includes(svc.id);
              return (
                <Pressable
                  key={svc.id}
                  onPress={() => toggleService(svc.id)}
                  bg={isSelected ? "$green500" : "$coolGray100"}
                  py="$3"
                  px="$4"
                  borderRadius="$md"
                  borderWidth="$1"
                  borderColor={isSelected ? "$green600" : "$coolGray200"}
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <VStack flex={1}>
                      <Text
                        fontFamily="$body"
                        color={isSelected ? "$white" : "$coolGray700"}
                        fontSize="$sm"
                      >
                        {svc.customName}
                      </Text>
                      <Text
                        fontFamily="$body"
                        color={isSelected ? "$green100" : "$coolGray500"}
                        fontSize="$xs"
                      >
                        {svc.estimatedMinutes}min
                      </Text>
                    </VStack>
                    <Text
                      fontFamily="$heading"
                      fontWeight="$bold"
                      color={isSelected ? "$white" : "$green700"}
                    >
                      R$ {svc.price.toFixed(2)}
                    </Text>
                  </HStack>
                </Pressable>
              );
            })}
          </VStack>

          {selectedServices.length > 0 && (
            <HStack
              bg="$green50"
              p="$3"
              borderRadius="$md"
              borderWidth="$1"
              borderColor="$green200"
              justifyContent="space-between"
              alignItems="center"
              mb="$4"
            >
              <Text fontFamily="$body" color="$green700">Total:</Text>
              <Text fontFamily="$heading" fontWeight="$bold" color="$green800" fontSize="$lg">
                R$ {selectedTotal.toFixed(2)}
              </Text>
            </HStack>
          )}

          {isInvalid && (
            <Text fontFamily="$body" color="$red500" fontSize="$sm" mb="$2">
              Informe o nome e selecione ao menos 1 servico.
            </Text>
          )}

          <Button
            title="Adicionar na Fila"
            onPress={handleSubmit}
            isLoading={isLoading}
          />

          <Button
            title="Cancelar"
            onPress={() => router.back()}
            bg="transparent"
            $active-bg="$red50"
            borderWidth="$1"
            borderColor="$red500"
            textColor="$red500"
          />
        </FormControl>
      </VStack>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
