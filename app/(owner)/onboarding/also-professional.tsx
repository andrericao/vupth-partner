import { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Header } from "@components/Header";
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

export default function AlsoProfessionalScreen() {
  const { establishmentId, ownerName: paramName } = useLocalSearchParams<{
    establishmentId: string;
    ownerName: string;
  }>();
  const [ownerName, setOwnerName] = useState(paramName ?? "");
  const [specialty, setSpecialty] = useState("BARBER");
  const [isLoading, setIsLoading] = useState(false);

  const quickCreateProfessional = useEstablishmentStore(
    (s) => s.quickCreateProfessional
  );
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const user = useAuthStore((s) => s.user);

  const alreadyProfessional = user?.roles?.includes("PROFESSIONAL");

  useEffect(() => {
    if (!alreadyProfessional || !establishmentId) return;

    const ensureAffiliation = async () => {
      try {
        const { data } = await api.get("/professional/me");
        const currentEstId = data.establishment_id ?? data.establishmentId;

        if (currentEstId === establishmentId) {
          router.replace("/(owner)/dashboard" as any);
          return;
        }

        if (currentEstId) {
          await useProfessionalStore.getState().switchEstablishment(establishmentId);
        } else {
          await useProfessionalStore.getState().affiliate(establishmentId);
        }
        await refreshToken();
      } catch {}
      router.replace("/(owner)/dashboard" as any);
    };

    ensureAffiliation();
    // refreshToken e estavel (Zustand); roda so ao entrar com esses params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alreadyProfessional, establishmentId]);

  useEffect(() => {
    if (!paramName) {
      SecureStore.getItemAsync("vupth_owner_name").then((stored) => {
        if (stored) setOwnerName(stored);
      });
    }
  }, [paramName]);

  const handleYes = async () => {
    if (!ownerName.trim()) {
      Alert.alert("Erro", "Nome do proprietario nao encontrado.");
      return;
    }

    if (!establishmentId) {
      Alert.alert("Erro", "Estabelecimento nao encontrado.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await quickCreateProfessional(
        ownerName.trim(),
        establishmentId,
        specialty
      );

      await useProfessionalStore.getState().setProfessional(result);
      await refreshToken();

      router.replace({
        pathname: "/(owner)/add-service",
        params: { establishmentId },
      } as any);
    } catch (error: any) {
      const code = error?.response?.data?.code;

      if (code === "USER_ALREADY_PROFESSIONAL" || error?.response?.status === 409) {
        try {
          const { data: me } = await api.get("/professional/me");
          const currentEstId = me.establishment_id ?? me.establishmentId;

          if (currentEstId === establishmentId) {
            await useProfessionalStore.getState().setProfessional(me);
          } else if (currentEstId) {
            await useProfessionalStore.getState().switchEstablishment(establishmentId);
            await useProfessionalStore.getState().fetchMe();
          } else {
            await useProfessionalStore.getState().affiliate(establishmentId);
            await useProfessionalStore.getState().fetchMe();
          }
        } catch (err: any) {
          Alert.alert("Erro", getApiErrorMessage(err, "Nao foi possivel vincular ao estabelecimento."));
          setIsLoading(false);
          return;
        }
        await refreshToken();
        router.replace({
          pathname: "/(owner)/add-service",
          params: { establishmentId },
        } as any);
        return;
      }

      const data = error?.response?.data;
      let msg = "Nao foi possivel criar o perfil profissional.";
      if (data?.fieldErrors) {
        msg = Object.entries(data.fieldErrors)
          .map(([field, err]) => `${field}: ${err}`)
          .join("\n");
      } else if (data?.message) {
        msg = data.message;
      }
      Alert.alert("Erro", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNo = () => {
    router.replace("/(owner)/dashboard" as any);
  };

  if (alreadyProfessional) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 pb-6 px-6">
          <Header showBackButton onBack={() => router.navigate("/(owner)/dashboard" as any)} />

          <View className="flex-1 justify-center px-2">
            <Text className="font-heading text-2xl mb-4 text-gray-900">
              Voce tambem sera profissional?
            </Text>

            <Text className="font-body text-base text-gray-600 mb-2">
              Se voce tambem atendera clientes neste estabelecimento, escolha sua
              especialidade abaixo.
            </Text>

            {ownerName ? (
              <Text className="font-body text-sm text-gray-500 mb-6">
                Profissional: {ownerName}
              </Text>
            ) : null}

            <Text className="font-heading text-base mb-2 text-gray-900">
              Especialidade
            </Text>

            <View className="mb-6">
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
              title="Sim, tambem serei profissional"
              onPress={handleYes}
              isLoading={isLoading}
            />

            <NwButton
              title="Nao, apenas proprietario"
              onPress={handleNo}
              variant="outlineDanger"
              className="mt-2"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
