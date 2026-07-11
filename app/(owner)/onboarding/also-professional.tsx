import { useState, useEffect } from "react";
import { VStack, Heading, Text } from "@gluestack-ui/themed";
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Header } from "@components/Header";
import { Button } from "@components/Button";
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
        <VStack flex={1} pb="$6" px="$6">
          <Header showBackButton onBack={() => router.navigate("/(owner)/dashboard" as any)} />

          <VStack flex={1} justifyContent="center" px="$2">
            <Heading size="2xl" fontFamily="$heading" mb="$4">
              Voce tambem sera profissional?
            </Heading>

            <Text fontFamily="$body" color="$coolGray600" mb="$2" fontSize="$md">
              Se voce tambem atendera clientes neste estabelecimento, escolha sua
              especialidade abaixo.
            </Text>

            {ownerName ? (
              <Text fontFamily="$body" color="$coolGray500" mb="$6" fontSize="$sm">
                Profissional: {ownerName}
              </Text>
            ) : null}

            <Heading size="md" fontFamily="$heading" mb="$2">
              Especialidade
            </Heading>

            <VStack space="xs" mb="$6">
              {SPECIALTIES.map((s) => (
                <Button
                  key={s.value}
                  title={s.label}
                  onPress={() => setSpecialty(s.value)}
                  bg={specialty === s.value ? "$green500" : "$coolGray200"}
                  textColor={specialty === s.value ? "$white" : "$coolGray700"}
                  $active-bg={specialty === s.value ? "$green600" : "$coolGray300"}
                  h="$10"
                  mt="$1"
                />
              ))}
            </VStack>

            <Button
              title="Sim, tambem serei profissional"
              onPress={handleYes}
              isLoading={isLoading}
              bg="$green500"
              $active-bg="$green600"
            />

            <Button
              title="Nao, apenas proprietario"
              onPress={handleNo}
              bg="transparent"
              $active-bg="$red50"
              borderWidth="$1"
              borderColor="$red500"
              textColor="$red500"
              mt="$2"
            />
          </VStack>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
