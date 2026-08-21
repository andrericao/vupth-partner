import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { useProfessionalStore } from "@store/professional.store";
import { useAuthStore } from "@store/auth.store";
import { api, getApiErrorMessage } from "@lib/api";

const SPECIALTIES = [
  { label: "Barbeiro", value: "BARBER" },
  { label: "Cabeleireiro(a)", value: "HAIRDRESSER" },
  { label: "Manicure", value: "NAIL_TECH" },
  { label: "Designer de sobrancelha", value: "EYEBROW_TECH" },
  { label: "Massagista", value: "MASSEUSE" },
  { label: "Esteticista", value: "ESTHETICIAN" },
];

// Card de CAMINHO (Andre 2026-08-07: "a intencao e sempre levar o usuario a um
// caminho, neste caso a solucao"). A pendencia "1+ profissional com servico"
// bloqueia a loja de abrir e caia aqui num formulario que criava o DONO como
// profissional sem dizer isso — parecia "cadastrar outra pessoa". Agora a tela
// abre com as saidas nomeadas.
function PathCard({
  title,
  hint,
  onPress,
  selected,
  testID,
}: {
  title: string;
  hint: string;
  onPress: () => void;
  selected?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected: !!selected }}
      className={`bg-vupth-surface p-4 rounded-[20px] mb-3 border ${
        selected ? "border-vupth-forest" : "border-transparent"
      } active:bg-gray-50`}
    >
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text className="font-heading text-gray-900">{title}</Text>
          <Text className="font-body text-xs text-gray-500 mt-0.5">{hint}</Text>
        </View>
        <Text className="font-body text-lg text-gray-400 ml-2">{"›"}</Text>
      </View>
    </Pressable>
  );
}

export default function AddProfessionalScreen() {
  const { establishmentId } = useLocalSearchParams<{ establishmentId: string }>();
  const user = useAuthStore((s) => s.user);
  const isProfessional = user?.roles?.includes("PROFESSIONAL");

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("BARBER");
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // O formulario so aparece depois que o dono escolhe "eu tambem vou atender" —
  // e o que deixa claro que o perfil criado e o DELE.
  const [meAsProfessional, setMeAsProfessional] = useState(false);

  const quickCreateProfessional = useEstablishmentStore(
    (s) => s.quickCreateProfessional
  );
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const goInvite = () =>
    router.push({
      pathname: "/(owner)/invite-professional",
      params: { establishmentId: establishmentId ?? "" },
    } as any);

  const goAffiliations = () =>
    router.push({
      pathname: "/(owner)/affiliations",
      params: { establishmentId: establishmentId ?? "" },
    } as any);

  const handleQuickCreate = async () => {
    if (!name.trim()) {
      setIsInvalid(true);
      return;
    }

    setIsInvalid(false);
    setIsLoading(true);

    try {
      const result = await quickCreateProfessional(
        name.trim(),
        establishmentId!,
        specialty
      );
      await useProfessionalStore.getState().setProfessional(result);
      await SecureStore.setItemAsync("vupth_owner_name", name.trim());
      await refreshToken();
      Alert.alert(
        "Perfil profissional criado",
        `${result.name} ja aparece como profissional da sua loja. Falta so cadastrar seus servicos para a loja poder abrir.`,
        [
          { text: "Depois", onPress: () => router.back() },
          {
            text: "Cadastrar servicos",
            onPress: () => router.replace("/(professional)/my-services?from=settings" as any),
          },
        ]
      );
    } catch (error: any) {
      const code = error?.response?.data?.code;

      if (code === "USER_ALREADY_PROFESSIONAL" || error?.response?.status === 409) {
        try {
          const { data: me } = await api.get("/professional/me");
          const currentEstId = me.establishment_id ?? me.establishmentId;

          if (currentEstId === establishmentId) {
            await useProfessionalStore.getState().setProfessional(me);
            await refreshToken();
            Alert.alert(
              "Tudo certo",
              "Seu perfil profissional ja esta vinculado a este estabelecimento.",
              [{ text: "OK", onPress: () => router.back() }]
            );
          } else if (currentEstId) {
            await useProfessionalStore.getState().switchEstablishment(establishmentId!);
            await useProfessionalStore.getState().fetchMe();
            await refreshToken();
            Alert.alert(
              "Vinculado",
              "Seu perfil profissional foi transferido para este estabelecimento.",
              [{ text: "OK", onPress: () => router.back() }]
            );
          } else {
            await useProfessionalStore.getState().affiliate(establishmentId!);
            await useProfessionalStore.getState().fetchMe();
            await refreshToken();
            Alert.alert(
              "Vinculado",
              "Seu perfil profissional foi vinculado a este estabelecimento.",
              [{ text: "OK", onPress: () => router.back() }]
            );
          }
        } catch (err: any) {
          Alert.alert("Erro", getApiErrorMessage(err, "Nao foi possivel verificar o perfil profissional."));
        }
      } else {
        const data = error?.response?.data;
        let msg = "Nao foi possivel criar o profissional.";
        if (data?.fieldErrors) {
          msg = Object.entries(data.fieldErrors)
            .map(([field, err]) => `${field}: ${err}`)
            .join("\n");
        } else if (data?.message) {
          msg = data.message;
        }
        Alert.alert("Erro", msg);
      }
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
        <View className="flex-1 py-12 px-4">
          <ScreenHeader
          title="Quem vai atender?"
          onBack={() => router.navigate("/(owner)/menu" as any)}
        />
          <Text className="font-body text-sm text-gray-600 mt-1 mb-4">
            Sua loja so aparece para os clientes com pelo menos um profissional com
            servico cadastrado. Ha dois caminhos:
          </Text>

          {!isProfessional && (
            <PathCard
              testID="path-me"
              title="Eu tambem vou atender"
              hint="cria o SEU perfil profissional — voce passa a ter fila propria"
              selected={meAsProfessional}
              onPress={() => setMeAsProfessional(true)}
            />
          )}

          <PathCard
            testID="path-invite"
            title="Convidar um profissional"
            hint="buscar pelo nome e enviar convite"
            onPress={goInvite}
          />

          <PathCard
            testID="path-requests"
            title="Ver solicitacoes"
            hint="quem ja pediu para trabalhar na sua loja"
            onPress={goAffiliations}
          />

          {/* O formulario do dono-profissional so abre depois da escolha. */}
          {!isProfessional && meAsProfessional && (
            <View className="mt-4">
              <Text className="font-heading text-base text-gray-900 mb-2">
                Seu perfil profissional
              </Text>

              <NwInput
                label="Seu nome"
                placeholder="Ex: João Silva"
                value={name}
                onChangeText={setName}
                error={isInvalid ? "Nome obrigatório" : ""}
              />

              <Text className="font-heading text-base text-gray-900 mt-2 mb-2">
                Especialidade
              </Text>

              <View className="gap-1 mb-4">
                {SPECIALTIES.map((s) => (
                  <NwButton
                    key={s.value}
                    title={s.label}
                    onPress={() => setSpecialty(s.value)}
                    variant={specialty === s.value ? "primary" : "secondary"}
                    className="h-10 mt-1"
                  />
                ))}
              </View>

              <NwButton
                title="Criar meu perfil profissional"
                onPress={handleQuickCreate}
                isLoading={isLoading}
              />
            </View>
          )}

          {isProfessional && (
            <Text className="font-body text-xs text-gray-500 mt-2">
              Voce ja tem perfil profissional nesta loja. Para somar mais gente,
              convide alguem ou espere uma solicitacao de vinculo.
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
