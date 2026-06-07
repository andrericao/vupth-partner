import { useState } from "react";
import { VStack, Heading, Text } from "@gluestack-ui/themed";
import { Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Header } from "@components/Header";
import { Button } from "@components/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { useProfessionalStore } from "@store/professional.store";
import { useAuthStore } from "@store/auth.store";

const SPECIALTIES = [
  { label: "Barbeiro", value: "BARBER" },
  { label: "Cabeleireiro(a)", value: "HAIRDRESSER" },
  { label: "Manicure", value: "NAIL_TECH" },
  { label: "Designer de sobrancelha", value: "EYEBROW_TECH" },
  { label: "Massagista", value: "MASSEUSE" },
  { label: "Esteticista", value: "ESTHETICIAN" },
];

export default function AlsoProfessionalScreen() {
  const { establishmentId, ownerName } = useLocalSearchParams<{
    establishmentId: string;
    ownerName: string;
  }>();
  const [specialty, setSpecialty] = useState("BARBER");
  const [isLoading, setIsLoading] = useState(false);

  const quickCreateProfessional = useEstablishmentStore(
    (s) => s.quickCreateProfessional
  );
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const handleYes = async () => {
    setIsLoading(true);
    try {
      const result = await quickCreateProfessional(
        ownerName!,
        establishmentId!,
        specialty
      );

      await useProfessionalStore.getState().setProfessional(result);

      await refreshToken();

      router.replace("/(owner)/dashboard" as any);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ??
        "Nao foi possivel criar o perfil profissional.";
      Alert.alert("Erro", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNo = () => {
    router.replace("/(owner)/dashboard" as any);
  };

  return (
    <VStack flex={1} pb="$6" px="$6">
      <Header />

      <VStack flex={1} justifyContent="center" px="$2">
        <Heading size="2xl" fontFamily="$heading" mb="$4">
          Voce tambem sera profissional?
        </Heading>

        <Text fontFamily="$body" color="$coolGray600" mb="$8" fontSize="$md">
          Se voce tambem atendera clientes neste estabelecimento, ative seu
          perfil profissional agora.
        </Text>

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
          bg="$coolGray300"
          $active-bg="$coolGray400"
          textColor="$coolGray800"
          mt="$2"
        />
      </VStack>
    </VStack>
  );
}
