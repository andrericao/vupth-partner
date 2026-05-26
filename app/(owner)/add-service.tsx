import { useState } from "react";
import {
  VStack,
  FormControl,
  Heading,
  ScrollView,
  Text,
  Pressable,
} from "@gluestack-ui/themed";
import { router, useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { Button } from "@components/Button";
import { useEstablishmentStore } from "@store/establishment.store";

const SPECIALTIES = [
  { label: "Barbeiro", value: "BARBER", serviceType: "BARBER" },
  { label: "Cabeleireiro(a)", value: "HAIRDRESSER", serviceType: "BEAUTY_SALON" },
  { label: "Manicure", value: "NAIL_TECH", serviceType: "NAIL_SALON" },
  { label: "Massagista", value: "MASSEUSE", serviceType: "SPA" },
  { label: "Esteticista", value: "ESTHETICIAN", serviceType: "CLINIC" },
];

const SERVICE_TYPE_TO_SPECIALTY: Record<string, string> = {
  BARBER: "BARBER",
  BEAUTY_SALON: "HAIRDRESSER",
  NAIL_SALON: "NAIL_TECH",
  SPA: "MASSEUSE",
  CLINIC: "ESTHETICIAN",
};

const SERVICE_ITEM_TYPES = [
  { label: "Corte à máquina", value: "CORTE_MAQUINA", serviceTypes: ["BARBER"] },
  { label: "Corte à tesoura", value: "CORTE_TESOURA", serviceTypes: ["BARBER"] },
  { label: "Barba", value: "BARBA", serviceTypes: ["BARBER"] },
  { label: "Design de sobrancelha", value: "SOBRANCELHA", serviceTypes: ["BARBER"] },
  { label: "Pintura", value: "PINTURA", serviceTypes: ["BARBER", "BEAUTY_SALON"] },
  { label: "Recorte das pontas", value: "RECORTE_PONTAS", serviceTypes: ["BEAUTY_SALON"] },
  { label: "Escova", value: "ESCOVA", serviceTypes: ["BEAUTY_SALON"] },
  { label: "Hidratação capilar", value: "HIDRATACAO", serviceTypes: ["BEAUTY_SALON"] },
  { label: "Progressiva", value: "PROGRESSIVA", serviceTypes: ["BEAUTY_SALON"] },
  { label: "Manicure", value: "MANICURE", serviceTypes: ["NAIL_SALON"] },
  { label: "Pedicure", value: "PEDICURE", serviceTypes: ["NAIL_SALON"] },
  { label: "Unhas em gel", value: "UNHAS_GEL", serviceTypes: ["NAIL_SALON"] },
  { label: "Nail art", value: "NAIL_ART", serviceTypes: ["NAIL_SALON"] },
  { label: "Massagem relaxante", value: "MASSAGEM_RELAXANTE", serviceTypes: ["SPA"] },
  { label: "Massagem modeladora", value: "MASSAGEM_MODELADORA", serviceTypes: ["SPA"] },
  { label: "Limpeza de pele", value: "LIMPEZA_PELE", serviceTypes: ["SPA", "CLINIC"] },
  { label: "Depilação", value: "DEPILACAO", serviceTypes: ["SPA"] },
  { label: "Drenagem linfática", value: "DRENAGEM", serviceTypes: ["SPA"] },
  { label: "Peeling facial", value: "PEELING", serviceTypes: ["CLINIC"] },
  { label: "Aplicação de botox", value: "BOTOX", serviceTypes: ["CLINIC"] },
  { label: "Microagulhamento", value: "MICROAGULHAMENTO", serviceTypes: ["CLINIC"] },
];

export default function AddServiceScreen() {
  const { establishmentId } = useLocalSearchParams<{ establishmentId: string }>();
  const establishment = useEstablishmentStore((s) => s.establishment);
  const estServiceType = establishment?.service_type ?? (establishment as any)?.serviceType;
  const defaultSpecialty = SERVICE_TYPE_TO_SPECIALTY[estServiceType] ?? "BARBER";

  const [specialty, setSpecialty] = useState(defaultSpecialty);

  const activeServiceType = SPECIALTIES.find((s) => s.value === specialty)?.serviceType ?? estServiceType ?? "BARBER";
  const filteredTypes = SERVICE_ITEM_TYPES.filter((t) => t.serviceTypes.includes(activeServiceType));

  const [serviceItemType, setServiceItemType] = useState(filteredTypes[0]?.value ?? "CORTE_MAQUINA");
  const [customName, setCustomName] = useState("");
  const [price, setPrice] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const addServiceItem = useEstablishmentStore((s) => s.addServiceItem);

  const handleSpecialtyChange = (newSpecialty: string) => {
    setSpecialty(newSpecialty);
    const newServiceType = SPECIALTIES.find((s) => s.value === newSpecialty)?.serviceType ?? "BARBER";
    const newFiltered = SERVICE_ITEM_TYPES.filter((t) => t.serviceTypes.includes(newServiceType));
    setServiceItemType(newFiltered[0]?.value ?? "CORTE_MAQUINA");
    setCustomName("");
  };

  const handleSubmit = async () => {
    const priceNum = parseFloat(price.replace(",", "."));
    if (!customName.trim() || isNaN(priceNum) || priceNum <= 0) {
      setIsInvalid(true);
      return;
    }

    setIsInvalid(false);
    setIsLoading(true);

    try {
      await addServiceItem(establishmentId!, serviceItemType, customName.trim(), priceNum);
      Alert.alert("Serviço adicionado", `${customName} — R$ ${priceNum.toFixed(2)}`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      const data = error?.response?.data;
      let msg = "Não foi possível adicionar o serviço.";
      if (data?.fieldErrors) {
        msg = Object.entries(data.fieldErrors)
          .map(([field, err]) => `${field}: ${err}`)
          .join("\n");
      } else if (data?.message) {
        msg = data.message;
      }
      console.error("addServiceItem error:", {
        status: error?.response?.status,
        data,
        sent: { serviceItemType, customName: customName.trim(), price: parseFloat(price.replace(",", ".")) },
      });
      Alert.alert("Erro", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton />

        <FormControl flex={1} mt="$12" isInvalid={isInvalid}>
          <Heading mb="$6" size="3xl" fontFamily="$heading">
            Novo Serviço
          </Heading>

          <Text fontFamily="$body" mb="$2" color="$coolGray600">
            Especialidade do profissional
          </Text>
          <VStack space="xs" mb="$4">
            {SPECIALTIES.map((s) => {
              const isSelected = specialty === s.value;
              return (
                <Pressable
                  key={s.value}
                  onPress={() => handleSpecialtyChange(s.value)}
                  bg={isSelected ? "$green500" : "$coolGray100"}
                  py="$2"
                  px="$4"
                  borderRadius="$md"
                  borderWidth="$1"
                  borderColor={isSelected ? "$green600" : "$coolGray200"}
                >
                  <Text
                    fontFamily="$body"
                    color={isSelected ? "$white" : "$coolGray700"}
                    textAlign="center"
                    fontSize="$sm"
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </VStack>

          <Text fontFamily="$body" mb="$2" color="$coolGray600">
            Tipo de serviço
          </Text>
          <VStack space="xs" mb="$4">
            {filteredTypes.map((s) => (
              <Button
                key={s.value}
                title={s.label}
                onPress={() => {
                  setServiceItemType(s.value);
                  if (!customName.trim()) setCustomName(s.label);
                }}
                bg={serviceItemType === s.value ? "$green500" : "$coolGray200"}
                textColor={serviceItemType === s.value ? "$white" : "$coolGray700"}
                $active-bg={serviceItemType === s.value ? "$green600" : "$coolGray300"}
                h="$10"
                mt="$1"
              />
            ))}
          </VStack>

          <Input
            textLabel="Nome personalizado"
            placeholder="Ex: Corte Social"
            messageError="Nome obrigatório"
            value={customName}
            onChangeText={setCustomName}
            testID="service-custom-name"
          />

          <Input
            textLabel="Preço (R$)"
            placeholder="35.00"
            messageError="Preço inválido"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />

          <Button
            title="Adicionar Serviço"
            onPress={handleSubmit}
            isLoading={isLoading}
          />
        </FormControl>
      </VStack>
    </ScrollView>
  );
}
