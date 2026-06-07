import { useState, useEffect, useCallback } from "react";
import {
  VStack,
  HStack,
  FormControl,
  Heading,
  ScrollView,
  Text,
  Pressable,
  Divider,
} from "@gluestack-ui/themed";
import { Alert, KeyboardAvoidingView, Platform, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { Button } from "@components/Button";
import { useProfessionalStore } from "@store/professional.store";
import { useEstablishmentStore } from "@store/establishment.store";
import {
  calculatePricing,
  getAbsorptionOptions,
} from "@lib/pricing";

const SERVICE_ITEM_TYPES = [
  { label: "Corte a maquina", value: "CORTE_MAQUINA", specialties: ["BARBER"] },
  { label: "Corte a tesoura", value: "CORTE_TESOURA", specialties: ["BARBER"] },
  { label: "Barba", value: "BARBA", specialties: ["BARBER"] },
  { label: "Design de sobrancelha", value: "SOBRANCELHA", specialties: ["BARBER", "EYEBROW_TECH"] },
  { label: "Pintura", value: "PINTURA", specialties: ["BARBER", "HAIRDRESSER"] },
  { label: "Recorte das pontas", value: "RECORTE_PONTAS", specialties: ["HAIRDRESSER"] },
  { label: "Escova", value: "ESCOVA", specialties: ["HAIRDRESSER"] },
  { label: "Hidratacao capilar", value: "HIDRATACAO", specialties: ["HAIRDRESSER"] },
  { label: "Progressiva", value: "PROGRESSIVA", specialties: ["HAIRDRESSER"] },
  { label: "Manicure", value: "MANICURE", specialties: ["NAIL_TECH"] },
  { label: "Pedicure", value: "PEDICURE", specialties: ["NAIL_TECH"] },
  { label: "Unhas em gel", value: "UNHAS_GEL", specialties: ["NAIL_TECH"] },
  { label: "Nail art", value: "NAIL_ART", specialties: ["NAIL_TECH"] },
  { label: "Massagem relaxante", value: "MASSAGEM_RELAXANTE", specialties: ["MASSEUSE"] },
  { label: "Massagem modeladora", value: "MASSAGEM_MODELADORA", specialties: ["MASSEUSE"] },
  { label: "Limpeza de pele", value: "LIMPEZA_PELE", specialties: ["MASSEUSE", "ESTHETICIAN"] },
  { label: "Depilacao", value: "DEPILACAO", specialties: ["MASSEUSE"] },
  { label: "Drenagem linfatica", value: "DRENAGEM", specialties: ["MASSEUSE"] },
  { label: "Peeling facial", value: "PEELING", specialties: ["ESTHETICIAN"] },
  { label: "Aplicacao de botox", value: "BOTOX", specialties: ["ESTHETICIAN"] },
  { label: "Microagulhamento", value: "MICROAGULHAMENTO", specialties: ["ESTHETICIAN"] },
];

const ABSORPTION_LABELS: Record<number, string> = {
  0: "Cliente paga tudo",
  25: "Eu pago 25%",
  50: "Metade cada",
  75: "Eu pago 75%",
  100: "Eu pago tudo",
};

export default function MyServicesScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  const myServices = useProfessionalStore((s) => s.myServices);
  const fetchMyServices = useProfessionalStore((s) => s.fetchMyServices);
  const addServiceItem = useEstablishmentStore((s) => s.addServiceItem);

  const [showForm, setShowForm] = useState(false);
  const [serviceItemType, setServiceItemType] = useState("");
  const [customName, setCustomName] = useState("");
  const [price, setPrice] = useState("");
  const [absorption, setAbsorption] = useState(0);
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const mySpecialty = professional?.specialty ?? "BARBER";
  const filteredTypes = SERVICE_ITEM_TYPES.filter(
    (t) => t.specialties.includes(mySpecialty) || t.specialties.length === 0
  );

  const priceNum = parseFloat((price || "0").replace(",", "."));
  const absorptionOptions = getAbsorptionOptions(priceNum);
  const pricing = priceNum > 0 ? calculatePricing(priceNum, absorption) : null;

  useEffect(() => {
    fetchMyServices();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyServices();
    setRefreshing(false);
  }, [fetchMyServices]);

  const handleSubmit = async () => {
    if (!customName.trim() || isNaN(priceNum) || priceNum <= 0 || !serviceItemType) {
      setIsInvalid(true);
      return;
    }

    if (!professional?.establishment_id) {
      Alert.alert("Erro", "Voce precisa estar vinculado a um estabelecimento.");
      return;
    }

    setIsInvalid(false);
    setIsLoading(true);

    try {
      await addServiceItem(
        professional.establishment_id,
        serviceItemType,
        customName.trim(),
        priceNum
      );
      Alert.alert("Servico adicionado", `${customName.trim()} — R$ ${priceNum.toFixed(2)}`);
      setShowForm(false);
      setServiceItemType("");
      setCustomName("");
      setPrice("");
      setAbsorption(0);
      await fetchMyServices();
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? "Nao foi possivel adicionar o servico.";
      Alert.alert("Erro", msg);
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton onBack={() => router.navigate("/(professional)/profile" as any)} />

        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Meus Servicos
        </Heading>

        {myServices.length > 0 && (
          <VStack mt="$4" space="sm">
            {myServices.map((svc) => (
              <HStack
                key={svc.id}
                bg="$white"
                p="$3"
                borderRadius="$md"
                borderWidth="$1"
                borderColor="$coolGray200"
                justifyContent="space-between"
                alignItems="center"
              >
                <VStack flex={1}>
                  <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900">
                    {svc.customName}
                  </Text>
                  <Text fontFamily="$body" fontSize="$xs" color="$coolGray500">
                    {svc.serviceItemType} • {svc.estimatedMinutes}min
                  </Text>
                </VStack>
                <Text fontFamily="$heading" fontWeight="$bold" color="$green700">
                  R$ {svc.price.toFixed(2)}
                </Text>
              </HStack>
            ))}
          </VStack>
        )}

        {myServices.length === 0 && !showForm && (
          <Text fontFamily="$body" color="$coolGray400" mt="$6" textAlign="center">
            Nenhum servico cadastrado
          </Text>
        )}

        {!showForm ? (
          <Button
            title="Adicionar Servico"
            onPress={() => setShowForm(true)}
            mt="$6"
          />
        ) : (
          <VStack mt="$6">
            <Divider mb="$4" />

            <FormControl isInvalid={isInvalid}>
              <Heading size="lg" fontFamily="$heading" mb="$4">
                Novo Servico
              </Heading>

              <Text fontFamily="$body" mb="$2" color="$coolGray600">
                Tipo de servico
              </Text>
              <VStack space="xs" mb="$4">
                {filteredTypes.map((s) => {
                  const isSelected = serviceItemType === s.value;
                  return (
                    <Pressable
                      key={s.value}
                      onPress={() => {
                        setServiceItemType(s.value);
                        if (!customName.trim()) setCustomName(s.label);
                      }}
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

              <Input
                textLabel="Nome personalizado"
                placeholder="Ex: Corte Social"
                messageError="Nome obrigatorio"
                value={customName}
                onChangeText={setCustomName}
              />

              <Input
                textLabel="Seu preco (R$) — voce recebe"
                placeholder="35.00"
                messageError="Preco invalido"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />

              {pricing && (
                <VStack
                  bg="$coolGray50"
                  p="$4"
                  borderRadius="$lg"
                  borderWidth="$1"
                  borderColor="$coolGray200"
                  mb="$4"
                >
                  <Text fontFamily="$heading" fontWeight="$bold" mb="$3" color="$coolGray700">
                    Politica de preco (preview)
                  </Text>

                  <Text fontFamily="$body" fontSize="$xs" color="$coolGray500" mb="$2">
                    Quem absorve a taxa (6%)?
                  </Text>

                  <HStack space="xs" mb="$3" flexWrap="wrap">
                    {absorptionOptions.map((pct) => {
                      const isSelected = absorption === pct;
                      return (
                        <Pressable
                          key={pct}
                          onPress={() => setAbsorption(pct)}
                          bg={isSelected ? "$green500" : "$white"}
                          py="$1.5"
                          px="$3"
                          borderRadius="$full"
                          borderWidth="$1"
                          borderColor={isSelected ? "$green600" : "$coolGray300"}
                          mb="$1"
                        >
                          <Text
                            fontFamily="$body"
                            fontSize="$xs"
                            color={isSelected ? "$white" : "$coolGray600"}
                          >
                            {ABSORPTION_LABELS[pct] ?? `${pct}%`}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </HStack>

                  <Divider mb="$3" />

                  <HStack justifyContent="space-between" mb="$1">
                    <Text fontFamily="$body" fontSize="$sm" color="$coolGray600">
                      Cliente paga:
                    </Text>
                    <Text fontFamily="$heading" fontWeight="$bold" color="$green700" fontSize="$lg">
                      R$ {pricing.clientPrice.toFixed(2)}
                    </Text>
                  </HStack>

                  <HStack justifyContent="space-between" mb="$1">
                    <Text fontFamily="$body" fontSize="$sm" color="$coolGray600">
                      Voce recebe:
                    </Text>
                    <Text fontFamily="$heading" fontWeight="$bold" color="$blue600">
                      R$ {pricing.proReceives.toFixed(2)}
                    </Text>
                  </HStack>

                  <HStack justifyContent="space-between">
                    <Text fontFamily="$body" fontSize="$sm" color="$coolGray600">
                      Taxa plataforma:
                    </Text>
                    <Text fontFamily="$body" fontSize="$sm" color="$coolGray400">
                      R$ {pricing.platformFee.toFixed(2)}
                    </Text>
                  </HStack>

                  <Text fontFamily="$body" fontSize="$xs" color="$amber600" mt="$3">
                    * Preview — no MVP o profissional recebe o valor integral
                  </Text>
                </VStack>
              )}

              <Button
                title="Adicionar Servico"
                onPress={handleSubmit}
                isLoading={isLoading}
              />

              <Button
                title="Cancelar"
                onPress={() => setShowForm(false)}
                bg="$coolGray300"
                $active-bg="$coolGray400"
              />
            </FormControl>
          </VStack>
        )}
      </VStack>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
