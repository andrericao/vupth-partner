import { useState } from "react";
import { VStack, FormControl, Heading, ScrollView } from "@gluestack-ui/themed";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { Button } from "@components/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { getApiErrorMessage } from "@lib/api";
import { maskCEP, unmask } from "@lib/masks";

export default function AddressScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const addAddress = useEstablishmentStore((s) => s.addAddress);

  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !state.trim()) {
      setIsInvalid(true);
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
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: unmask(zipCode),
      });
      Alert.alert("Endereco salvo", "Endereco do estabelecimento atualizado.", [
        { text: "OK", onPress: () => router.replace("/(owner)/dashboard" as any) },
      ]);
    } catch (error: any) {
      const msg = getApiErrorMessage(error, "Nao foi possivel salvar o endereco.");
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
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 160 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <VStack flex={1} py="$12" px="$6" alignItems="center">
        <Header showBackButton onBack={() => router.navigate("/(owner)/menu" as any)} />

        <FormControl flex={1} mt="$8" isInvalid={isInvalid}>
          <Heading mb="$12" size="3xl" fontFamily="$heading">
            Endereco da Loja
          </Heading>

          <Input
            textLabel="CEP"
            placeholder="01310-100"
            messageError="CEP invalido"
            value={zipCode}
            onChangeText={(t) => setZipCode(maskCEP(t))}
            keyboardType="number-pad"
            maxLength={9}
          />

          <Input
            textLabel="Logradouro"
            placeholder="Rua de exemplo"
            messageError="Campo obrigatorio"
            value={street}
            onChangeText={setStreet}
          />

          <Input
            textLabel="Numero"
            placeholder="123"
            messageError="Campo obrigatorio"
            value={number}
            onChangeText={setNumber}
            keyboardType="numeric"
          />

          <Input
            textLabel="Bairro"
            placeholder="Bairro"
            messageError="Campo obrigatorio"
            value={neighborhood}
            onChangeText={setNeighborhood}
          />

          <Input
            textLabel="Cidade"
            placeholder="Cidade"
            messageError="Campo obrigatorio"
            value={city}
            onChangeText={setCity}
          />

          <Input
            textLabel="Estado"
            placeholder="SP"
            messageError="Campo obrigatorio"
            value={state}
            onChangeText={setState}
            autoCapitalize="characters"
            maxLength={2}
          />

          <Button
            title="Salvar Endereco"
            onPress={handleSubmit}
            isLoading={isLoading}
          />
        </FormControl>
      </VStack>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
