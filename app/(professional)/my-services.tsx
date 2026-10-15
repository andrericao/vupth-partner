import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { ServiceTypeGrid } from "@components/ServiceTypeGrid";
import { useProfessionalStore } from "@store/professional.store";
import { getApiErrorMessage } from "@lib/api";
import { confirmar } from "@lib/confirmar";
import { maskMoney, unmaskMoney } from "@lib/masks";
import { corpoDoSplit, precoParaEditar } from "@lib/split";
import { mascaraMinutos, lerMinutos, MINUTOS_PADRAO, rotuloDoTempo } from "@lib/tempoDoServico";

import {
  calculatePricing,
  getAbsorptionOptions,
  type PricingResult,
} from "@lib/pricing";
import { useLimparAoSair } from "@hooks/useLimparAoSair";
import { TIPOS_DE_SERVICO, tiposDaEspecialidade, tipoDoServico } from "@lib/tiposDeServico";



const SERVICE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TIPOS_DE_SERVICO.map((t) => [t.value, t.label])
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

/**
 * A previa do preco — a mesma no "Novo servico" e na edicao de um servico. Eram
 * duas copias identicas na tela; agora uma.
 */
function PreviaDePreco({
  pricing,
  opcoes,
  absorcao,
  onAbsorcao,
  className = "",
}: {
  pricing: PricingResult;
  opcoes: readonly number[];
  absorcao: number;
  onAbsorcao: (pct: number) => void;
  className?: string;
}) {
  return (
    <View className={`bg-vupth-surface p-4 rounded-card border border-vupth-border ${className}`}>
      <Text className="font-heading text-vupth-textSecondary mb-3">Politica de preco (preview)</Text>

      <Text className="font-body text-xs text-vupth-textSecondary mb-2">
        Quem absorve as Taxas Vupth (6%)?
      </Text>

      <View className="flex-row flex-wrap gap-1 mb-3">
        {opcoes.map((pct) => {
          const ativo = absorcao === pct;
          return (
            <Pressable
              key={pct}
              onPress={() => onAbsorcao(pct)}
              accessibilityRole="button"
              accessibilityState={{ selected: ativo }}
              className={`py-1.5 px-3 rounded-full border mb-1 ${
                ativo ? "bg-vupth-forest border-vupth-forest" : "bg-white border-vupth-border"
              }`}
            >
              <Text className={`font-body text-xs ${ativo ? "text-white" : "text-vupth-textSecondary"}`}>
                {ABSORPTION_LABELS[pct] ?? `${pct}%`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="h-px bg-vupth-border mb-3" />

      <View className="flex-row justify-between mb-1">
        <Text className="font-body text-sm text-vupth-textSecondary">Cliente paga:</Text>
        <Text className="font-heading text-lg text-vupth-forest">R$ {pricing.clientPrice.toFixed(2)}</Text>
      </View>

      <View className="flex-row justify-between mb-1">
        <Text className="font-body text-sm text-vupth-textSecondary">Você recebe:</Text>
        <Text className="font-heading text-vupth-forest">R$ {pricing.proReceives.toFixed(2)}</Text>
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
}

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
  const [editMinutes, setEditMinutes] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editAbsorption, setEditAbsorption] = useState(0);
  const [isEditSaving, setIsEditSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [serviceItemType, setServiceItemType] = useState("");
  const [customName, setCustomName] = useState("");
  const [price, setPrice] = useState("");
  const [minutes, setMinutes] = useState(String(MINUTOS_PADRAO));

  // Mesma regra: sair da tela limpa o que ficou pela metade (10/09).
  useLimparAoSair(() => {
    setEditName("");
    setEditPrice("");
    setServiceItemType("");
    setCustomName("");
    setPrice("");
    setEditMinutes("");
    setMinutes(String(MINUTOS_PADRAO));
  });
  const [absorption, setAbsorption] = useState(0);
  const [nameInvalid, setNameInvalid] = useState(false);
  const [priceInvalid, setPriceInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // tipo-de-servico-sumiu (PAR-14): especialidade fora da lista (o backend
  // aceita texto livre, ex. "Corte") deixava a grade vazia. Agora cai em todos.
  const filteredTypes = tiposDaEspecialidade(professional?.specialty);

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

  const startEditItem = (svc: {
    id: string;
    customName: string;
    price: number;
    estimatedMinutes?: number;
    base_price?: number | null;
    pro_receives?: number | null;
  }) => {
    setShowForm(false);
    setEditingId(svc.id);
    setEditName(svc.customName);
    setEditMinutes(String(svc.estimatedMinutes ?? MINUTOS_PADRAO));
    // Com a divisao gravada, volta o digitado e a absorcao escolhidos. Servico
    // legado: estima o digitado pelo preco (salvar grava a divisao).
    const { digitado, absorcao } = precoParaEditar(svc);
    setEditPrice(maskMoney(String(Math.round(digitado * 100))));
    setEditAbsorption(absorcao);
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
    const minutosEdit = lerMinutos(editMinutes);
    if (minutosEdit == null) {
      Alert.alert("Tempo inválido", "Informe o tempo do serviço entre 5 e 480 minutos.");
      return;
    }
    // Preco do cliente + a divisao gravada, sempre juntos: price sozinho
    // apagaria a divisao no backend.
    setIsEditSaving(true);
    try {
      await updateMyServiceItem(itemId, {
        customName: trimmed,
        estimatedMinutes: minutosEdit,
        ...corpoDoSplit(editPriceNum, editAbsorption),
      });
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
    // tipo-uma-vez (PAR-15): o tipo nunca trava o cadastro — sem escolha, vale
    // o primeiro da especialidade.
    const tipo = tipoDoServico(filteredTypes, serviceItemType);
    const minutos = lerMinutos(minutes);
    if (minutos == null) {
      Alert.alert("Tempo inválido", "Informe o tempo do serviço entre 5 e 480 minutos.");
      return;
    }

    setIsLoading(true);

    // Preco do cliente + a divisao gravada (contrato de 18/09).
    const split = corpoDoSplit(priceNum, absorption);
    const finalPrice = split.price;

    try {
      await addMyServiceItem(tipo, customName.trim(), split, minutos);
      Alert.alert("Serviço adicionado", `${customName.trim()} — R$ ${finalPrice.toFixed(2)}`);
      setShowForm(false);
      setServiceItemType("");
      setCustomName("");
      setPrice("");
      setMinutes(String(MINUTOS_PADRAO));
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
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="flex-1 pb-12 px-4">
          <ScreenHeader title="Meus serviços" onBack={() => router.navigate(backTarget as any)} />

          {professional?.establishment_id && professional?.establishment_name ? (
            <Text className="font-body text-sm text-vupth-forest mt-1">
              {professional.establishment_name}
            </Text>
          ) : null}

          {!professional?.establishment_id && (
            <View className="bg-vupth-warning p-4 rounded-card mt-6 items-center">
              <Text className="font-body text-vupth-forest text-center mb-4">
                Você precisa estar vinculado a um estabelecimento para adicionar serviços. Se já solicitou vinculação, aguarde a aprovação do proprietário e arraste para baixo para atualizar.
              </Text>
              <NwButton
                title="Buscar estabelecimento"
                onPress={() => router.push("/(professional)/find-establishment" as any)}
                className="self-stretch"
              />
            </View>
          )}

          {myServices.length > 0 && (
            <View className="mt-4 gap-2">
              {myServices.map((svc) =>
                editingId === svc.id ? (
                  <View key={svc.id} className="bg-vupth-surface p-3 rounded-md border border-vupth-forest">
                    <NwInput
                      label="Nome do serviço"
                      placeholder="Ex: Corte Social"
                      value={editName}
                      onChangeText={setEditName}
                      testID="edit-service-name"
                    />
                    <NwInput
                      label="Tempo do serviço (min)"
                      placeholder="30"
                      value={editMinutes}
                      onChangeText={(t) => setEditMinutes(mascaraMinutos(t))}
                      keyboardType="number-pad"
                      testID="edit-service-minutes"
                    />
                    <NwInput
                      label="Seu preço — você recebe"
                      placeholder="R$ 35,00"
                      value={editPrice}
                      onChangeText={(t) => setEditPrice(maskMoney(t))}
                      keyboardType="number-pad"
                      testID="edit-service-price"
                    />

                    {editPricing && (
                      <PreviaDePreco
                        pricing={editPricing}
                        opcoes={editAbsorptionOptions}
                        absorcao={editAbsorption}
                        onAbsorcao={setEditAbsorption}
                        className="mt-3 mb-2"
                      />
                    )}

                    <View className="flex-row gap-2 mt-1">
                      <NwButton
                        title="Cancelar"
                        variant="secondary"
                        onPress={cancelEditItem}
                        className="flex-1"
                      />
                      <NwButton
                        title="Salvar"
                        onPress={() => handleSaveEdit(svc.id)}
                        isLoading={isEditSaving}
                        className="flex-1"
                      />
                    </View>
                  </View>
                ) : (
                  <View
                    key={svc.id}
                    className="flex-row items-center justify-between bg-vupth-surface p-4 rounded-card"
                  >
                    <View className="flex-1">
                      <Text className="font-heading text-vupth-forest">{svc.customName}</Text>
                      <Text className="font-body text-xs text-vupth-textSecondary">
                        {humanizeServiceType(svc.serviceItemType)}
                        {rotuloDoTempo(svc.estimatedMinutes)}
                      </Text>
                      <View className="flex-row gap-3 mt-1">
                        <Pressable onPress={() => startEditItem(svc)} accessibilityRole="button" hitSlop={6}>
                          <Text className="font-body text-xs text-vupth-forest">Editar</Text>
                        </Pressable>
                        <Pressable onPress={() => handleRemoveItem(svc)} accessibilityRole="button" hitSlop={6}>
                          <Text className="font-body text-xs text-vupth-danger">Remover</Text>
                        </Pressable>
                      </View>
                    </View>
                    <Text className="font-heading text-vupth-forest">R$ {svc.price.toFixed(2)}</Text>
                  </View>
                )
              )}
            </View>
          )}

          {myServices.length === 0 && !showForm && (
            <Text className="font-body text-vupth-textSecondary mt-6 text-center">Nenhum serviço cadastrado</Text>
          )}

          {!showForm && professional?.establishment_id ? (
            <NwButton
              title="Adicionar serviço"
              onPress={() => {
                const first = filteredTypes[0];
                setServiceItemType(first?.value ?? "");
                if (first && !customName.trim()) setCustomName(first.label);
                setShowForm(true);
              }}
              className="mt-6"
            />
          ) : showForm ? (
            <View className="mt-6">
              <View className="h-px bg-vupth-border mb-4" />

              <Text className="font-heading text-xl text-vupth-forest mb-4">Novo Serviço</Text>

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
                testID="service-name"
              />

              {/* O tempo entra na previsao da fila (backend); sem ele, 30 min. */}
              <NwInput
                label="Tempo do serviço (min)"
                placeholder="30"
                value={minutes}
                onChangeText={(t) => setMinutes(mascaraMinutos(t))}
                keyboardType="number-pad"
                testID="service-minutes"
              />

              <NwInput
                label="Seu preço — você recebe"
                placeholder="R$ 35,00"
                error={priceInvalid ? "Digite um preço válido — ex: R$ 35,00" : ""}
                value={price}
                onChangeText={(t) => {
                  setPrice(maskMoney(t));
                  if (priceInvalid) setPriceInvalid(false);
                }}
                keyboardType="number-pad"
                testID="service-price"
              />

              {pricing && (
                <PreviaDePreco
                  pricing={pricing}
                  opcoes={absorptionOptions}
                  absorcao={absorption}
                  onAbsorcao={setAbsorption}
                  className="mb-4"
                />
              )}

              <NwButton
                title="Adicionar serviço"
                onPress={handleSubmit}
                isLoading={isLoading}
                className="mt-5"
              />
              {/* Cancelar e a metade negativa de uma escolha: `secondary`, nao vermelho. */}
              <NwButton
                title="Cancelar"
                variant="secondary"
                onPress={() => setShowForm(false)}
                className="mt-3"
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
