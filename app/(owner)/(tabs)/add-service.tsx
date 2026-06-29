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
import { router, useLocalSearchParams } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { Button } from "@components/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { useAuthStore } from "@store/auth.store";
import { calculatePricing, getAbsorptionOptions } from "@lib/pricing";
import { maskMoney, unmaskMoney } from "@lib/masks";

const SPECIALTIES = [
  { label: "Barbeiro", value: "BARBER", serviceType: "BARBER" },
  { label: "Cabeleireiro(a)", value: "HAIRDRESSER", serviceType: "BEAUTY_SALON" },
  { label: "Manicure", value: "NAIL_TECH", serviceType: "NAIL_SALON" },
  { label: "Designer de sobrancelha", value: "EYEBROW_TECH", serviceType: "EYEBROW" },
  { label: "Massagista", value: "MASSEUSE", serviceType: "SPA" },
  { label: "Esteticista", value: "ESTHETICIAN", serviceType: "CLINIC" },
];

const SERVICE_TYPE_TO_SPECIALTY: Record<string, string> = {
  BARBER: "BARBER",
  BEAUTY_SALON: "HAIRDRESSER",
  NAIL_SALON: "NAIL_TECH",
  EYEBROW: "EYEBROW_TECH",
  SPA: "MASSEUSE",
  CLINIC: "ESTHETICIAN",
};

const SERVICE_ITEM_TYPES = [
  { label: "Corte à máquina", value: "CORTE_MAQUINA", serviceTypes: ["BARBER"] },
  { label: "Corte à tesoura", value: "CORTE_TESOURA", serviceTypes: ["BARBER"] },
  { label: "Barba", value: "BARBA", serviceTypes: ["BARBER"] },
  { label: "Design de sobrancelha", value: "SOBRANCELHA", serviceTypes: ["BARBER", "EYEBROW"] },
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
  { label: "Henna de sobrancelha", value: "HENNA_SOBRANCELHA", serviceTypes: ["EYEBROW"] },
  { label: "Micropigmentacao fio a fio", value: "MICROPIGMENTACAO_SOBRANCELHA", serviceTypes: ["EYEBROW"] },
  { label: "Brow lamination", value: "BROW_LAMINATION", serviceTypes: ["EYEBROW"] },
  { label: "Tintura de sobrancelha", value: "TINTURA_SOBRANCELHA", serviceTypes: ["EYEBROW"] },
];

export default function AddServiceScreen() {
  const { establishmentId } = useLocalSearchParams<{ establishmentId: string }>();
  // Servico e capacidade do PROFISSIONAL: o owner so adiciona se tambem acumular
  // o papel PROFESSIONAL. Guard defensivo (a tela ja some do menu nesse caso).
  // Decisao de produto 2026-06-28.
  const isProfessional = useAuthStore((s) => s.user?.roles?.includes("PROFESSIONAL"));
  useEffect(() => {
    if (!isProfessional) router.replace("/(owner)/menu" as any);
  }, [isProfessional]);

  const establishment = useEstablishmentStore((s) => s.establishment);
  const estServiceType = establishment?.service_type ?? (establishment as any)?.serviceType;
  const defaultSpecialty = SERVICE_TYPE_TO_SPECIALTY[estServiceType] ?? "BARBER";

  const [specialty, setSpecialty] = useState(defaultSpecialty);

  const activeServiceType = SPECIALTIES.find((s) => s.value === specialty)?.serviceType ?? estServiceType ?? "BARBER";
  const filteredTypes = SERVICE_ITEM_TYPES.filter((t) => t.serviceTypes.includes(activeServiceType));

  const [serviceItemType, setServiceItemType] = useState(filteredTypes[0]?.value ?? "CORTE_MAQUINA");
  const [customName, setCustomName] = useState("");
  const [price, setPrice] = useState("");
  const [absorption, setAbsorption] = useState(0);
  const [showPricing, setShowPricing] = useState(false);
  const [nameInvalid, setNameInvalid] = useState(false);
  const [priceInvalid, setPriceInvalid] = useState(false);
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
    const priceNum = unmaskMoney(price);
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

    setIsLoading(true);

    // Preco salvo e o total que o cliente paga (digitado + taxas conforme absorcao)
    const finalPrice = calculatePricing(priceNum, absorption).clientPrice;

    try {
      await addServiceItem(establishmentId!, serviceItemType, customName.trim(), finalPrice);
      Alert.alert("Serviço adicionado", `${customName} — R$ ${finalPrice.toFixed(2)}`, [
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
        sent: { serviceItemType, customName: customName.trim(), price: finalPrice },
      });
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
    >
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton onBack={() => router.navigate("/(owner)/menu" as any)} />

        <VStack flex={1} mt="$12">
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
                  // Tocar numa sugestao de tipo SUBSTITUI o nome no formulario
                  // (antes so preenchia se vazio — nao trocava no 2o servico).
                  setServiceItemType(s.value);
                  setCustomName(s.label);
                  setNameInvalid(false);
                }}
                bg={serviceItemType === s.value ? "$green500" : "$coolGray200"}
                textColor={serviceItemType === s.value ? "$white" : "$coolGray700"}
                $active-bg={serviceItemType === s.value ? "$green600" : "$coolGray300"}
                h="$10"
                mt="$1"
              />
            ))}
          </VStack>

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
              testID="service-custom-name"
            />
          </FormControl>

          <FormControl isInvalid={priceInvalid}>
            <Input
              textLabel="Preço"
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

          <Pressable
            onPress={() => setShowPricing(!showPricing)}
            bg="$coolGray50"
            p="$3"
            borderRadius="$md"
            mb="$3"
            borderWidth="$1"
            borderColor={showPricing ? "$green300" : "$coolGray200"}
          >
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray700">
              {showPricing ? "▼" : "▶"} Politica de preco (preview)
            </Text>
            <Text fontFamily="$body" fontSize="$xs" color="$coolGray400">
              Simule como ficara com taxas + arredondamento R$X,90
            </Text>
          </Pressable>

          {showPricing && unmaskMoney(price) > 0 && (() => {
            const priceNum = unmaskMoney(price);
            const options = getAbsorptionOptions(priceNum);
            const pricing = calculatePricing(priceNum, absorption);
            const labels: Record<number, string> = {
              0: "Cliente paga tudo",
              25: "Pro paga 25%",
              50: "Metade cada",
              75: "Pro paga 75%",
              100: "Pro paga tudo",
            };
            return (
              <VStack bg="$coolGray50" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200" mb="$3">
                <Text fontFamily="$body" fontSize="$xs" color="$coolGray500" mb="$2">
                  Quem absorve as Taxas Vupth (6%)?
                </Text>
                <HStack space="xs" mb="$3" flexWrap="wrap">
                  {options.map((pct) => (
                    <Pressable
                      key={pct}
                      onPress={() => setAbsorption(pct)}
                      bg={absorption === pct ? "$green500" : "$white"}
                      py="$1.5"
                      px="$3"
                      borderRadius="$full"
                      borderWidth="$1"
                      borderColor={absorption === pct ? "$green600" : "$coolGray300"}
                      mb="$1"
                    >
                      <Text fontFamily="$body" fontSize="$xs" color={absorption === pct ? "$white" : "$coolGray600"}>
                        {labels[pct] ?? `${pct}%`}
                      </Text>
                    </Pressable>
                  ))}
                </HStack>
                <HStack justifyContent="space-between" mb="$1">
                  <Text fontFamily="$body" fontSize="$sm" color="$coolGray600">Cliente paga:</Text>
                  <Text fontFamily="$heading" fontWeight="$bold" color="$green700" fontSize="$lg">
                    R$ {pricing.clientPrice.toFixed(2)}
                  </Text>
                </HStack>
                <HStack justifyContent="space-between" mb="$1">
                  <Text fontFamily="$body" fontSize="$sm" color="$coolGray600">Pro recebe:</Text>
                  <Text fontFamily="$heading" fontWeight="$bold" color="$blue600">
                    R$ {pricing.proReceives.toFixed(2)}
                  </Text>
                </HStack>
                <HStack justifyContent="space-between">
                  <Text fontFamily="$body" fontSize="$sm" color="$coolGray600">Taxas Vupth:</Text>
                  <Text fontFamily="$body" fontSize="$sm" color="$coolGray400">
                    R$ {pricing.platformFee.toFixed(2)}
                  </Text>
                </HStack>
                <Text fontFamily="$body" fontSize="$xs" color="$amber600" mt="$3">
                  * O preco salvo do servico e o total pago pelo cliente
                </Text>
              </VStack>
            );
          })()}

          <Button
            title="Adicionar Serviço"
            onPress={handleSubmit}
            isLoading={isLoading}
          />
        </VStack>
      </VStack>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
