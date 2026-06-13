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
import { getApiErrorMessage } from "@lib/api";

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

const SERVICE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  SERVICE_ITEM_TYPES.map((t) => [t.value, t.label])
);

function humanizeServiceType(value: string): string {
  return (
    SERVICE_TYPE_LABELS[value] ??
    value
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

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
  const fetchMe = useProfessionalStore((s) => s.fetchMe);
  const addMyServiceItem = useProfessionalStore((s) => s.addMyServiceItem);

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
    if (professional?.establishment_id) {
      fetchMyServices();
    } else {
      fetchMe().catch(() => {});
    }
  }, [professional?.establishment_id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (!useProfessionalStore.getState().professional?.establishment_id) {
        await fetchMe();
      }
      if (useProfessionalStore.getState().professional?.establishment_id) {
        await fetchMyServices();
      }
    } catch {}
    setRefreshing(false);
  }, [fetchMe, fetchMyServices]);

  const handleSubmit = async () => {
    if (!customName.trim() || isNaN(priceNum) || priceNum <= 0 || !serviceItemType) {
      setIsInvalid(true);
      return;
    }

    setIsInvalid(false);
    setIsLoading(true);

    // Preco salvo e o total que o cliente paga (digitado + taxas conforme absorcao)
    const finalPrice = pricing ? pricing.clientPrice : priceNum;

    try {
      await addMyServiceItem(
        serviceItemType,
        customName.trim(),
        finalPrice
      );
      Alert.alert("Servico adicionado", `${customName.trim()} — R$ ${finalPrice.toFixed(2)}`);
      setShowForm(false);
      setServiceItemType("");
      setCustomName("");
      setPrice("");
      setAbsorption(0);
      await fetchMyServices();
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel adicionar o servico."));
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

        {professional?.establishment_id && professional?.establishment_name ? (
          <Text fontFamily="$body" fontSize="$sm" color="$green600" mt="$1">
            Vinculado a {professional.establishment_name}
          </Text>
        ) : null}

        {!professional?.establishment_id && (
          <VStack
            bg="$amber50"
            p="$4"
            borderRadius="$lg"
            borderWidth="$1"
            borderColor="$amber200"
            mt="$6"
            alignItems="center"
          >
            <Text fontFamily="$body" color="$amber700" textAlign="center" mb="$4">
              Voce precisa estar vinculado a um estabelecimento para adicionar servicos. Se ja solicitou vinculacao, aguarde a aprovacao do proprietario e arraste para baixo para atualizar.
            </Text>
            <Button
              title="Buscar Estabelecimento"
              onPress={() => router.push("/(professional)/find-establishment" as any)}
            />
          </VStack>
        )}

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
                    {humanizeServiceType(svc.serviceItemType)} • {svc.estimatedMinutes}min
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

        {!showForm && professional?.establishment_id ? (
          <Button
            title="Adicionar Servico"
            onPress={() => setShowForm(true)}
            mt="$6"
          />
        ) : showForm ? (
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
                    * O preco salvo do servico e o total pago pelo cliente
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
                bg="transparent"
                $active-bg="$red50"
                borderWidth="$1"
                borderColor="$red500"
                textColor="$red500"
              />
            </FormControl>
          </VStack>
        ) : null}
      </VStack>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
