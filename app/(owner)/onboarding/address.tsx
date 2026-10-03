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
import { avisar } from "@lib/confirmar";
import { pegarLocalizacao, preencherVazios } from "@lib/localizacao";
import { mensagemDoEnderecoSalvo } from "@lib/pontoNoMapa";
import { MapPin } from "lucide-react-native";

export default function AddressScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const addAddress = useEstablishmentStore((s) => s.addAddress);
  const updateAddress = useEstablishmentStore((s) => s.updateAddress);
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
  // "Usar minha localizacao" (build 1.4.0): a coordenada vai junto com o
  // endereco — sem ela a loja some da busca por proximidade (S25).
  const [coordenada, setCoordenada] = useState<{ latitude: number; longitude: number } | null>(null);
  const [localizando, setLocalizando] = useState(false);
  // Com o id do endereco salvo, corrigir e PATCH (o POST cria outro endereco).
  // So quando o backend o expoe no address embutido.
  const [addressId, setAddressId] = useState<string | null>(null);

  const usarMinhaLocalizacao = async () => {
    setLocalizando(true);
    try {
      const { coordenada: c, endereco } = await pegarLocalizacao();
      setCoordenada(c);
      if (endereco) {
        const r = preencherVazios(
          { street, number, neighborhood, city, state, zipCode },
          { ...endereco, zipCode: maskCEP(endereco.zipCode) }
        );
        setStreet(r.street);
        setNumber(r.number);
        setNeighborhood(r.neighborhood);
        setCity(r.city);
        setState(r.state);
        setZipCode(r.zipCode);
      }
    } catch (error: any) {
      await avisar({ titulo: "Localização", mensagem: error?.message ?? "Não foi possível ler a localização." });
    } finally {
      setLocalizando(false);
    }
  };

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
        if (a.addressId) setAddressId(a.addressId);
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
      const endereco = {
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim() || undefined,
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: unmask(zipCode),
        ...(coordenada ?? {}),
      };
      const salvo = addressId
        ? await updateAddress(establishment.id, addressId, endereco)
        : await addAddress(establishment.id, endereco);
      // O endereco JA FOI salvo — sem a caixa na web o dono ficava no
      // formulario sem saber, e salvava de novo. A mensagem diz se a loja ja
      // entra na busca por perto (loja-sem-coordenada, S25).
      await avisar({
        titulo: "Endereço salvo",
        mensagem: mensagemDoEnderecoSalvo(salvo),
      });
      router.replace("/(owner)/dashboard" as any);
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

            {/* Estando na loja, um toque: a posicao exata e o endereco do lugar
                (so preenche o que ainda esta vazio). */}
            <NwButton
              title={coordenada ? "Localização registrada ✓" : "Usar minha localização"}
              variant="vupthOutline"
              icon={<MapPin size={18} color="#163300" />}
              onPress={usarMinhaLocalizacao}
              isLoading={localizando}
              className="mb-4"
            />

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
                <ActivityIndicator size="small" color="#163300" />
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
