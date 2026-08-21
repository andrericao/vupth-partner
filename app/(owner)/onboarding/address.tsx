import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { getApiErrorMessage } from "@lib/api";
import { maskCEP, unmask } from "@lib/masks";
import { lookupCep } from "@lib/cep";

export default function AddressScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const addAddress = useEstablishmentStore((s) => s.addAddress);
  const fetchEstablishmentById = useEstablishmentStore((s) => s.fetchEstablishmentById);

  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  // Read-back: ao abrir, busca o endereco ja salvo (GET /establishment/id/{id},
  // que retorna `address`) e pre-preenche o form — assim o endereco "aparece"
  // ao reabrir. Se vier vazio mesmo apos salvar, o problema esta no backend
  // (nao persiste/retorna o address) — ver PRD BUG4.
  useEffect(() => {
    if (!establishment?.id) return;
    let active = true;
    fetchEstablishmentById(establishment.id)
      .then((detail) => {
        const a = detail?.address;
        if (!active || !a) return;
        if (a.street) setStreet(a.street);
        if (a.number) setNumber(a.number);
        if (a.complement) setComplement(a.complement);
        if (a.neighborhood) setNeighborhood(a.neighborhood);
        if (a.city) setCity(a.city);
        if (a.state) setState(a.state);
        if (a.zipCode) setZipCode(maskCEP(a.zipCode));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // re-busca so quando muda o estabelecimento; fetchEstablishmentById e estavel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [establishment?.id]);

  const handleCepChange = async (text: string) => {
    const masked = maskCEP(text);
    setZipCode(masked);

    if (unmask(masked).length === 8) {
      setCepLoading(true);
      const found = await lookupCep(masked);
      setCepLoading(false);
      if (found) {
        if (found.street) setStreet(found.street);
        if (found.neighborhood) setNeighborhood(found.neighborhood);
        if (found.city) setCity(found.city);
        if (found.state) setState(found.state);
      }
    }
  };

  const handleSubmit = async () => {
    const missing = [
      !street.trim() && "rua",
      !number.trim() && "número",
      !neighborhood.trim() && "bairro",
      !city.trim() && "cidade",
      !state.trim() && "estado (UF)",
    ].filter(Boolean);
    if (missing.length) {
      setIsInvalid(true);
      Alert.alert("Endereço incompleto", `Preencha: ${missing.join(", ")}.`);
      return;
    }

    if (!establishment) {
      Alert.alert("Erro", "Nenhum estabelecimento encontrado.");
      return;
    }

    setIsInvalid(false);
    setIsLoading(true);

    try {
      await addAddress(establishment.id, {
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim() || undefined,
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: unmask(zipCode),
      });
      Alert.alert("Endereço salvo", "Endereço do estabelecimento atualizado.", [
        { text: "OK", onPress: () => router.replace("/(owner)/dashboard" as any) },
      ]);
    } catch (error: any) {
      const msg = getApiErrorMessage(error, "Não foi possível salvar o endereço.");
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
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 pb-12 px-4">
          <ScreenHeader
            title="Endereço da loja"
            subtitle="O cliente vê a distância até você."
            onBack={() => router.navigate("/(owner)/establishment-data" as any)}
          />

          <View className="flex-1 w-full">

            <NwInput
              label="CEP"
              placeholder="01310-100"
              value={zipCode}
              onChangeText={handleCepChange}
              keyboardType="number-pad"
              maxLength={9}
              error={isInvalid ? "CEP inválido" : ""}
            />

            {cepLoading && (
              <View className="flex-row items-center gap-2 mb-3 -mt-1">
                <ActivityIndicator size="small" color="#3b7a3f" />
                <Text className="font-body text-xs text-vupth-textSecondary">
                  Buscando endereço pelo CEP...
                </Text>
              </View>
            )}

            <NwInput
              label="Logradouro"
              placeholder="Rua de exemplo"
              value={street}
              onChangeText={setStreet}
              error={isInvalid ? "Campo obrigatório" : ""}
            />

            <NwInput
              label="Número"
              placeholder="123"
              value={number}
              onChangeText={setNumber}
              keyboardType="numeric"
              error={isInvalid ? "Campo obrigatório" : ""}
            />

            <NwInput
              label="Complemento (opcional)"
              placeholder="Apto 4B, sala 2, fundos..."
              value={complement}
              onChangeText={setComplement}
            />

            <NwInput
              label="Bairro"
              placeholder="Bairro"
              value={neighborhood}
              onChangeText={setNeighborhood}
              error={isInvalid ? "Campo obrigatório" : ""}
            />

            <NwInput
              label="Cidade"
              placeholder="Cidade"
              value={city}
              onChangeText={setCity}
              error={isInvalid ? "Campo obrigatório" : ""}
            />

            <NwInput
              label="Estado"
              placeholder="SP"
              value={state}
              onChangeText={setState}
              autoCapitalize="characters"
              maxLength={2}
              error={isInvalid ? "Campo obrigatório" : ""}
            />

            <NwButton
              title="Salvar endereço"
              onPress={handleSubmit}
              isLoading={isLoading}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
