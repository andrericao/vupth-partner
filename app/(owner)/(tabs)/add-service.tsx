import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { ServiceTypeGrid } from "@components/ServiceTypeGrid";
import { useEstablishmentStore } from "@store/establishment.store";
import { useAuthStore } from "@store/auth.store";
import { calculatePricing, getAbsorptionOptions } from "@lib/pricing";
import { maskMoney, unmaskMoney } from "@lib/masks";
import { corpoDoSplit } from "@lib/split";
import { avisar } from "@lib/confirmar";
import { useLimparAoSair } from "@hooks/useLimparAoSair";

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

  // Formulario meio-preenchido nao pode sobreviver a saida da tela (10/09).
  // Ver src/hooks/useLimparAoSair.ts.
  useLimparAoSair(() => {
    setCustomName("");
    setPrice("");
  });
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
    // Preco do cliente + a divisao gravada (contrato de 18/09).
    const split = corpoDoSplit(priceNum, absorption);
    const finalPrice = split.price;

    try {
      await addServiceItem(establishmentId!, serviceItemType, customName.trim(), split);
      // O servico JA FOI criado — sem a caixa na web a tela nao fechava e o
      // dono cadastrava o mesmo servico duas vezes.
      await avisar({
        titulo: "Serviço adicionado",
        mensagem: `${customName} — R$ ${finalPrice.toFixed(2)}`,
      });
      router.back();
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
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 pb-12 px-4">
          <ScreenHeader title="Novo serviço" onBack={() => router.navigate("/(owner)/menu" as any)} />

          <View className="flex-1">
            <Text className="font-body text-vupth-textSecondary mb-2">Especialidade do profissional</Text>
            <View className="gap-1 mb-4">
              {SPECIALTIES.map((s) => {
                const isSelected = specialty === s.value;
                return (
                  <Pressable
                    key={s.value}
                    onPress={() => handleSpecialtyChange(s.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    className={`py-2 px-4 rounded-md border active:opacity-80 ${
                      isSelected ? "bg-vupth-forest border-vupth-forest" : "bg-vupth-surface border-vupth-border"
                    }`}
                  >
                    <Text
                      className={`font-body text-sm text-center ${
                        isSelected ? "text-white" : "text-vupth-textSecondary"
                      }`}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="font-body text-vupth-textSecondary mb-2">Tipo de serviço</Text>
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

            <NwInput
              label="Nome personalizado"
              placeholder="Ex: Corte Social"
              error={nameInvalid ? "Digite um nome para o serviço" : ""}
              value={customName}
              onChangeText={(t) => {
                setCustomName(t);
                if (nameInvalid) setNameInvalid(false);
              }}
              testID="service-custom-name"
            />

            <NwInput
              label="Preço"
              placeholder="R$ 35,00"
              error={priceInvalid ? "Digite um preço válido — ex: R$ 35,00" : ""}
              value={price}
              onChangeText={(t) => {
                setPrice(maskMoney(t));
                if (priceInvalid) setPriceInvalid(false);
              }}
              keyboardType="number-pad"
            />

            <Pressable
              onPress={() => setShowPricing(!showPricing)}
              accessibilityRole="button"
              className={`bg-vupth-surface p-3 rounded-md mb-3 border active:opacity-80 ${
                showPricing ? "border-vupth-forest" : "border-vupth-border"
              }`}
            >
              <Text className="font-body text-sm text-vupth-textSecondary">
                {showPricing ? "▼" : "▶"} Politica de preco (preview)
              </Text>
              <Text className="font-body text-xs text-vupth-textSecondary">
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
                <View className="bg-vupth-surface p-4 rounded-md border border-vupth-border mb-3">
                  <Text className="font-body text-xs text-vupth-textSecondary mb-2">
                    Quem absorve as Taxas Vupth (6%)?
                  </Text>
                  <View className="flex-row flex-wrap gap-1 mb-3">
                    {options.map((pct) => {
                      const ativo = absorption === pct;
                      return (
                        <Pressable
                          key={pct}
                          onPress={() => setAbsorption(pct)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: ativo }}
                          className={`py-1.5 px-3 rounded-full border mb-1 ${
                            ativo ? "bg-vupth-forest border-vupth-forest" : "bg-white border-vupth-border"
                          }`}
                        >
                          <Text
                            className={`font-body text-xs ${ativo ? "text-white" : "text-vupth-textSecondary"}`}
                          >
                            {labels[pct] ?? `${pct}%`}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="font-body text-sm text-vupth-textSecondary">Cliente paga:</Text>
                    <Text className="font-heading text-lg text-vupth-forest">
                      R$ {pricing.clientPrice.toFixed(2)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="font-body text-sm text-vupth-textSecondary">Pro recebe:</Text>
                    <Text className="font-heading text-vupth-forest">
                      R$ {pricing.proReceives.toFixed(2)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="font-body text-sm text-vupth-textSecondary">Taxas Vupth:</Text>
                    <Text className="font-body text-sm text-vupth-textSecondary">
                      R$ {pricing.platformFee.toFixed(2)}
                    </Text>
                  </View>
                  <Text className="font-body text-xs text-vupth-textSecondary mt-3">
                    * O preco salvo do servico e o total pago pelo cliente
                  </Text>
                </View>
              );
            })()}

            <NwButton
              title="Adicionar serviço"
              onPress={handleSubmit}
              isLoading={isLoading}
              className="mt-9"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
