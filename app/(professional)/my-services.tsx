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
import { ServiceTypeGrid } from "@components/ServiceTypeGrid";
import { useProfessionalStore } from "@store/professional.store";
import { getApiErrorMessage } from "@lib/api";
import { cardShadow } from "@lib/styles";
import { maskMoney, unmaskMoney } from "@lib/masks";

import {
  calculatePricing,
  getAbsorptionOptions,
  estimateDesiredFromClient,
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
  const updateMyServiceItem = useProfessionalStore((s) => s.updateMyServiceItem);
  const removeMyServiceItem = useProfessionalStore((s) => s.removeMyServiceItem);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editAbsorption, setEditAbsorption] = useState(0);
  const [isEditSaving, setIsEditSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [serviceItemType, setServiceItemType] = useState("");
  const [customName, setCustomName] = useState("");
  const [price, setPrice] = useState("");
  const [absorption, setAbsorption] = useState(0);
  const [nameInvalid, setNameInvalid] = useState(false);
  const [priceInvalid, setPriceInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const mySpecialty = professional?.specialty ?? "BARBER";
  const filteredTypes = SERVICE_ITEM_TYPES.filter(
    (t) => t.specialties.includes(mySpecialty) || t.specialties.length === 0
  );

  const priceNum = unmaskMoney(price);
  const absorptionOptions = getAbsorptionOptions(priceNum);
  const pricing = priceNum > 0 ? calculatePricing(priceNum, absorption) : null;

  // Edicao: mesmo modelo de preco do cadastro (preview da formula + ,90).
  const editPriceNum = unmaskMoney(editPrice);
  const editAbsorptionOptions = getAbsorptionOptions(editPriceNum);
  const editPricing =
    editPriceNum > 0 ? calculatePricing(editPriceNum, editAbsorption) : null;

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

  const startEditItem = (svc: { id: string; customName: string; price: number }) => {
    setShowForm(false);
    setEditingId(svc.id);
    setEditName(svc.customName);
    // svc.price = clientPrice salvo. Reconstruimos o preco-base (a 0% absorcao)
    // para o input "voce recebe" e o preview reaparecerem coerentes.
    const base = estimateDesiredFromClient(svc.price);
    setEditPrice(maskMoney(String(Math.round(base * 100))));
    setEditAbsorption(0);
  };

  const cancelEditItem = () => {
    setEditingId(null);
    setEditName("");
    setEditPrice("");
    setEditAbsorption(0);
  };

  const handleSaveEdit = async (itemId: string) => {
    const trimmed = editName.trim();
    if (!trimmed || isNaN(editPriceNum) || editPriceNum <= 0) {
      Alert.alert("Dados invalidos", "Informe um nome e um preco maior que zero.");
      return;
    }
    // Preco salvo = total que o cliente paga (digitado + taxas conforme absorcao),
    // com a estetica X,90 — igual ao cadastro.
    const newPrice = editPricing ? editPricing.clientPrice : editPriceNum;
    setIsEditSaving(true);
    try {
      await updateMyServiceItem(itemId, { customName: trimmed, price: newPrice });
      cancelEditItem();
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel salvar o servico."));
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleRemoveItem = (svc: { id: string; customName: string }) => {
    Alert.alert(
      "Remover servico",
      `Deseja remover "${svc.customName}"? Esta acao nao pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMyServiceItem(svc.id);
              if (editingId === svc.id) cancelEditItem();
            } catch (error: any) {
              Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel remover o servico."));
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    const nameBad = !customName.trim();
    const priceBad = isNaN(priceNum) || priceNum <= 0;
    setNameInvalid(nameBad);
    setPriceInvalid(priceBad);
    if (nameBad || priceBad) {
      const faltam = [
        nameBad && "o nome do serviço",
        priceBad && "um preço válido (ex: R$ 35,00)",
      ]
        .filter(Boolean)
        .join(" e ");
      Alert.alert("Faltou preencher", `Informe ${faltam}.`);
      return;
    }
    if (!serviceItemType) {
      Alert.alert("Selecione o tipo", "Escolha o tipo de serviço antes de adicionar.");
      return;
    }

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
            {professional.establishment_name}
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
            {myServices.map((svc) =>
              editingId === svc.id ? (
                <VStack
                  key={svc.id}
                  bg="$white"
                  p="$3"
                  borderRadius="$md"
                  borderWidth="$1"
                  borderColor="$green400"
                >
                  <FormControl>
                    <Input
                      textLabel="Nome do servico"
                      placeholder="Ex: Corte Social"
                      messageError=""
                      value={editName}
                      onChangeText={setEditName}
                    />
                    <Input
                      textLabel="Seu preço — você recebe"
                      placeholder="R$ 35,00"
                      messageError=""
                      value={editPrice}
                      onChangeText={(t) => setEditPrice(maskMoney(t))}
                      keyboardType="number-pad"
                    />
                  </FormControl>

                  {editPricing && (
                    <VStack
                      bg="$coolGray50"
                      p="$4"
                      borderRadius="$lg"
                      borderWidth="$1"
                      borderColor="$coolGray200"
                      mt="$3"
                      mb="$2"
                    >
                      <Text fontFamily="$heading" fontWeight="$bold" mb="$3" color="$coolGray700">
                        Politica de preco (preview)
                      </Text>

                      <Text fontFamily="$body" fontSize="$xs" color="$coolGray500" mb="$2">
                        Quem absorve as Taxas Vupth (6%)?
                      </Text>

                      <HStack space="xs" mb="$3" flexWrap="wrap">
                        {editAbsorptionOptions.map((pct) => {
                          const isSelected = editAbsorption === pct;
                          return (
                            <Pressable
                              key={pct}
                              onPress={() => setEditAbsorption(pct)}
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
                          R$ {editPricing.clientPrice.toFixed(2)}
                        </Text>
                      </HStack>

                      <HStack justifyContent="space-between" mb="$1">
                        <Text fontFamily="$body" fontSize="$sm" color="$coolGray600">
                          Voce recebe:
                        </Text>
                        <Text fontFamily="$heading" fontWeight="$bold" color="$blue600">
                          R$ {editPricing.proReceives.toFixed(2)}
                        </Text>
                      </HStack>

                      <HStack justifyContent="space-between">
                        <Text fontFamily="$body" fontSize="$sm" color="$coolGray600">
                          Taxas Vupth:
                        </Text>
                        <Text fontFamily="$body" fontSize="$sm" color="$coolGray400">
                          R$ {editPricing.platformFee.toFixed(2)}
                        </Text>
                      </HStack>

                      <Text fontFamily="$body" fontSize="$xs" color="$amber600" mt="$3">
                        * O preco salvo do servico e o total pago pelo cliente
                      </Text>
                    </VStack>
                  )}

                  <HStack space="sm" mt="$1">
                    <Button
                      title="Cancelar"
                      onPress={cancelEditItem}
                      bg="$coolGray200"
                      textColor="$coolGray700"
                      h="$9"
                      flex={1}
                    />
                    <Button
                      title="Salvar"
                      onPress={() => handleSaveEdit(svc.id)}
                      isLoading={isEditSaving}
                      bg="$green500"
                      $active-bg="$green600"
                      h="$9"
                      flex={1}
                    />
                  </HStack>
                </VStack>
              ) : (
                <HStack
                  key={svc.id}
                  bg="$white"
                  p="$4"
                  borderRadius="$2xl"
                  style={cardShadow}
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
                    <HStack space="md" mt="$1">
                      <Pressable onPress={() => startEditItem(svc)}>
                        <Text fontFamily="$body" fontSize="$xs" color="$blue600">
                          Editar
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => handleRemoveItem(svc)}>
                        <Text fontFamily="$body" fontSize="$xs" color="$red500">
                          Remover
                        </Text>
                      </Pressable>
                    </HStack>
                  </VStack>
                  <Text fontFamily="$heading" fontWeight="$bold" color="$green700">
                    R$ {svc.price.toFixed(2)}
                  </Text>
                </HStack>
              )
            )}
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
            onPress={() => {
              const first = filteredTypes[0];
              setServiceItemType(first?.value ?? "");
              if (first && !customName.trim()) setCustomName(first.label);
              setShowForm(true);
            }}
            mt="$6"
          />
        ) : showForm ? (
          <VStack mt="$6">
            <Divider mb="$4" />

            <VStack>
              <Heading size="lg" fontFamily="$heading" mb="$4">
                Novo Servico
              </Heading>

              <Text fontFamily="$body" mb="$2" color="$coolGray600">
                Tipo de servico
              </Text>
              {/* [#11] grade de chips com icone (substitui a lista de pilulas).
                  Tocar substitui o nome no formulario. */}
              <ServiceTypeGrid
                items={filteredTypes}
                selected={serviceItemType}
                onSelect={(it) => {
                  setServiceItemType(it.value);
                  setCustomName(it.label);
                  setNameInvalid(false);
                }}
              />

              <FormControl isInvalid={nameInvalid}>
                <Input
                  textLabel="Nome personalizado"
                  placeholder="Ex: Corte Social"
                  messageError="Digite um nome para o serviço"
                  value={customName}
                  onChangeText={(t) => {
                    setCustomName(t);
                    if (nameInvalid) setNameInvalid(false);
                  }}
                />
              </FormControl>

              <FormControl isInvalid={priceInvalid}>
                <Input
                  textLabel="Seu preço — você recebe"
                  placeholder="R$ 35,00"
                  messageError="Digite um preço válido — ex: R$ 35,00"
                  value={price}
                  onChangeText={(t) => {
                    setPrice(maskMoney(t));
                    if (priceInvalid) setPriceInvalid(false);
                  }}
                  keyboardType="number-pad"
                />
              </FormControl>

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
                    Quem absorve as Taxas Vupth (6%)?
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
                      Taxas Vupth:
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
            </VStack>
          </VStack>
        ) : null}
      </VStack>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
