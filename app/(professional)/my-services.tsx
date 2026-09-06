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
import { router, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { Input } from "@components/Input";
import { Button } from "@components/Button";
import { BrandButton } from "@components/brand/Button";
import { ServiceTypeGrid } from "@components/ServiceTypeGrid";
import { useProfessionalStore } from "@store/professional.store";
import { getApiErrorMessage } from "@lib/api";
import { confirmar } from "@lib/confirmar";
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
  // Voltar retorna a ORIGEM real (Configuracoes, Fila ou card de pendencia).
  // Sem isto o botao caia sempre na Fila (feedback Andre 2026-07-24).
  const { from } = useLocalSearchParams<{ from?: string }>();
  const backTarget =
    from === "queue" ? "/(professional)/queue" : "/(professional)/settings";

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
    // fetchMe/fetchMyServices sao estaveis (Zustand); reage so ao vinculo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      Alert.alert("Dados inválidos", "Informe um nome e um preco maior que zero.");
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
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível salvar o serviço."));
    } finally {
      setIsEditSaving(false);
    }
  };

  // ⚠️ `confirmar()` e nao `Alert.alert` com botoes: o react-native-web nao
  // implementa o Alert, entao na web a caixa nunca aparecia e o toque parecia
  // nao ter efeito — foi o "botao de remover servico nao funciona" da issue #25.
  const handleRemoveItem = async (svc: { id: string; customName: string }) => {
    const ok = await confirmar({
      titulo: "Remover serviço",
      mensagem: `Deseja remover "${svc.customName}"? Esta ação não pode ser desfeita.`,
      confirmar: "Remover",
      destrutivo: true,
    });
    if (!ok) return;

    try {
      await removeMyServiceItem(svc.id);
      if (editingId === svc.id) cancelEditItem();
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível remover o serviço."));
    }
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
      Alert.alert("Serviço adicionado", `${customName.trim()} — R$ ${finalPrice.toFixed(2)}`);
      setShowForm(false);
      setServiceItemType("");
      setCustomName("");
      setPrice("");
      setAbsorption(0);
      await fetchMyServices();
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível adicionar o serviço."));
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
      <VStack flex={1} pb="$12" px="$4">
        <ScreenHeader
          title="Meus serviços"
          onBack={() => router.navigate(backTarget as any)}
        />

        {professional?.establishment_id && professional?.establishment_name ? (
          <Text fontFamily="$body" fontSize="$sm" color="$forest" mt="$1">
            {professional.establishment_name}
          </Text>
        ) : null}

        {!professional?.establishment_id && (
          <VStack
            bg="$brandWarning"
            p="$4"
            borderRadius="$card"
            borderWidth="$1"
            borderColor="$brandWarning"
            mt="$6"
            alignItems="center"
          >
            <Text fontFamily="$body" color="$forest" textAlign="center" mb="$4">
              Você precisa estar vinculado a um estabelecimento para adicionar serviços. Se já solicitou vinculação, aguarde a aprovação do proprietário e arraste para baixo para atualizar.
            </Text>
            <BrandButton
              title="Buscar estabelecimento"
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
                  bg="$brandSurface"
                  p="$3"
                  borderRadius="$md"
                  borderWidth="$1"
                  borderColor="$forest"
                >
                  <FormControl>
                    <Input
                      textLabel="Nome do serviço"
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
                      bg="$brandSurface"
                      p="$4"
                      borderRadius="$card"
                      borderWidth="$1"
                      borderColor="$brandBorder"
                      mt="$3"
                      mb="$2"
                    >
                      <Text fontFamily="$heading" fontWeight="$bold" mb="$3" color="$brandTextSecondary">
                        Politica de preco (preview)
                      </Text>

                      <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary" mb="$2">
                        Quem absorve as Taxas Vupth (6%)?
                      </Text>

                      <HStack space="xs" mb="$3" flexWrap="wrap">
                        {editAbsorptionOptions.map((pct) => {
                          const isSelected = editAbsorption === pct;
                          return (
                            <Pressable
                              key={pct}
                              onPress={() => setEditAbsorption(pct)}
                              bg={isSelected ? "$forest" : "$white"}
                              py="$1.5"
                              px="$3"
                              borderRadius="$full"
                              borderWidth="$1"
                              borderColor={isSelected ? "$forest" : "$brandBorder"}
                              mb="$1"
                            >
                              <Text
                                fontFamily="$body"
                                fontSize="$xs"
                                color={isSelected ? "$white" : "$brandTextSecondary"}
                              >
                                {ABSORPTION_LABELS[pct] ?? `${pct}%`}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </HStack>

                      <Divider mb="$3" />

                      <HStack justifyContent="space-between" mb="$1">
                        <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary">
                          Cliente paga:
                        </Text>
                        <Text fontFamily="$heading" fontWeight="$bold" color="$forest" fontSize="$lg">
                          R$ {editPricing.clientPrice.toFixed(2)}
                        </Text>
                      </HStack>

                      <HStack justifyContent="space-between" mb="$1">
                        <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary">
                          Você recebe:
                        </Text>
                        <Text fontFamily="$heading" fontWeight="$bold" color="$forest">
                          R$ {editPricing.proReceives.toFixed(2)}
                        </Text>
                      </HStack>

                      <HStack justifyContent="space-between">
                        <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary">
                          Taxas Vupth:
                        </Text>
                        <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary">
                          R$ {editPricing.platformFee.toFixed(2)}
                        </Text>
                      </HStack>

                      <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary" mt="$3">
                        * O preco salvo do servico e o total pago pelo cliente
                      </Text>
                    </VStack>
                  )}

                  <HStack space="sm" mt="$1">
                    <Button
                      title="Cancelar"
                      onPress={cancelEditItem}
                      bg="$brandBorder"
                      textColor="$brandTextSecondary"
                      h="$9"
                      flex={1}
                    />
                    <BrandButton
                      title="Salvar"
                      onPress={() => handleSaveEdit(svc.id)}
                      isLoading={isEditSaving}
                      h="$9"
                      flex={1}
                    />
                  </HStack>
                </VStack>
              ) : (
                <HStack
                  key={svc.id}
                  bg="$brandSurface"
                  p="$4"
                  borderRadius="$card"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <VStack flex={1}>
                    <Text fontFamily="$heading" fontWeight="$bold" color="$forest">
                      {svc.customName}
                    </Text>
                    <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary">
                      {humanizeServiceType(svc.serviceItemType)} • {svc.estimatedMinutes}min
                    </Text>
                    <HStack space="md" mt="$1">
                      <Pressable onPress={() => startEditItem(svc)}>
                        <Text fontFamily="$body" fontSize="$xs" color="$forest">
                          Editar
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => handleRemoveItem(svc)}>
                        <Text fontFamily="$body" fontSize="$xs" color="$brandDanger">
                          Remover
                        </Text>
                      </Pressable>
                    </HStack>
                  </VStack>
                  <Text fontFamily="$heading" fontWeight="$bold" color="$forest">
                    R$ {svc.price.toFixed(2)}
                  </Text>
                </HStack>
              )
            )}
          </VStack>
        )}

        {myServices.length === 0 && !showForm && (
          <Text fontFamily="$body" color="$brandTextSecondary" mt="$6" textAlign="center">
            Nenhum serviço cadastrado
          </Text>
        )}

        {!showForm && professional?.establishment_id ? (
          <BrandButton
            title="Adicionar serviço"
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
                Novo Serviço
              </Heading>

              <Text fontFamily="$body" mb="$2" color="$brandTextSecondary">
                Tipo de serviço
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
                  bg="$brandSurface"
                  p="$4"
                  borderRadius="$card"
                  borderWidth="$1"
                  borderColor="$brandBorder"
                  mb="$4"
                >
                  <Text fontFamily="$heading" fontWeight="$bold" mb="$3" color="$brandTextSecondary">
                    Politica de preco (preview)
                  </Text>

                  <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary" mb="$2">
                    Quem absorve as Taxas Vupth (6%)?
                  </Text>

                  <HStack space="xs" mb="$3" flexWrap="wrap">
                    {absorptionOptions.map((pct) => {
                      const isSelected = absorption === pct;
                      return (
                        <Pressable
                          key={pct}
                          onPress={() => setAbsorption(pct)}
                          bg={isSelected ? "$forest" : "$white"}
                          py="$1.5"
                          px="$3"
                          borderRadius="$full"
                          borderWidth="$1"
                          borderColor={isSelected ? "$forest" : "$brandBorder"}
                          mb="$1"
                        >
                          <Text
                            fontFamily="$body"
                            fontSize="$xs"
                            color={isSelected ? "$white" : "$brandTextSecondary"}
                          >
                            {ABSORPTION_LABELS[pct] ?? `${pct}%`}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </HStack>

                  <Divider mb="$3" />

                  <HStack justifyContent="space-between" mb="$1">
                    <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary">
                      Cliente paga:
                    </Text>
                    <Text fontFamily="$heading" fontWeight="$bold" color="$forest" fontSize="$lg">
                      R$ {pricing.clientPrice.toFixed(2)}
                    </Text>
                  </HStack>

                  <HStack justifyContent="space-between" mb="$1">
                    <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary">
                      Você recebe:
                    </Text>
                    <Text fontFamily="$heading" fontWeight="$bold" color="$forest">
                      R$ {pricing.proReceives.toFixed(2)}
                    </Text>
                  </HStack>

                  <HStack justifyContent="space-between">
                    <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary">
                      Taxas Vupth:
                    </Text>
                    <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary">
                      R$ {pricing.platformFee.toFixed(2)}
                    </Text>
                  </HStack>

                  <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary" mt="$3">
                    * O preco salvo do servico e o total pago pelo cliente
                  </Text>
                </VStack>
              )}

              <BrandButton
                title="Adicionar serviço"
                onPress={handleSubmit}
                isLoading={isLoading}
                mt="$9"
              />

              <Button
                title="Cancelar"
                onPress={() => setShowForm(false)}
                bg="transparent"
                $active-bg="$brandSurface"
                borderWidth="$1"
                borderColor="$brandDanger"
                textColor="$brandDanger"
              />
            </VStack>
          </VStack>
        ) : null}
      </VStack>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
