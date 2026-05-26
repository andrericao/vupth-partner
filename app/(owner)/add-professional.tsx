import { useState } from "react";
import {
  VStack,
  FormControl,
  Heading,
  ScrollView,
} from "@gluestack-ui/themed";
import { router, useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { Button } from "@components/Button";
import { useEstablishmentStore } from "@store/establishment.store";

const SPECIALTIES = [
  { label: "Barbeiro", value: "BARBER" },
  { label: "Cabeleireiro(a)", value: "HAIRDRESSER" },
  { label: "Manicure", value: "NAIL_TECH" },
  { label: "Massagista", value: "MASSEUSE" },
  { label: "Esteticista", value: "ESTHETICIAN" },
];

export default function AddProfessionalScreen() {
  const { establishmentId } = useLocalSearchParams<{ establishmentId: string }>();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("BARBER");
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const quickCreateProfessional = useEstablishmentStore(
    (s) => s.quickCreateProfessional
  );

  const handleSubmit = async () => {
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
      Alert.alert(
        "Profissional criado",
        `${result.name} adicionado com sucesso!`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || "Não foi possível adicionar o profissional.";
      Alert.alert("Erro", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack
        flex={1}
        py="$12"
        px="$6"
        alignItems="center"
        justifyContent="center"
      >
        <Header showBackButton />

        <FormControl flex={1} mt="$48" isInvalid={isInvalid}>
          <Heading mb="$12" size="3xl" fontFamily="$heading">
            Novo Profissional
          </Heading>

          <Input
            textLabel="Nome"
            placeholder="Nome do profissional"
            messageError="Nome obrigatório"
            value={name}
            onChangeText={setName}
          />

          <Heading size="md" fontFamily="$heading" mt="$4" mb="$2">
            Especialidade
          </Heading>

          <VStack space="xs" mb="$4">
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
            title="Adicionar Profissional"
            onPress={handleSubmit}
            isLoading={isLoading}
          />
        </FormControl>
      </VStack>
    </ScrollView>
  );
}
