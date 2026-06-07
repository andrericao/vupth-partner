import { useState } from "react";
import {
  VStack,
  FormControl,
  Heading,
  ScrollView,
} from "@gluestack-ui/themed";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { Button } from "@components/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { useProfessionalStore } from "@store/professional.store";

const SPECIALTIES = [
  { label: "Barbeiro", value: "BARBER" },
  { label: "Cabeleireiro(a)", value: "HAIRDRESSER" },
  { label: "Manicure", value: "NAIL_TECH" },
  { label: "Designer de sobrancelha", value: "EYEBROW_TECH" },
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
  const affiliate = useProfessionalStore((s) => s.affiliate);
  const professional = useProfessionalStore((s) => s.professional);

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
      const code = error?.response?.data?.code;

      if (code === "USER_ALREADY_PROFESSIONAL") {
        const currentEstId = professional?.establishment_id;

        if (currentEstId === establishmentId) {
          Alert.alert(
            "Tudo certo",
            "Seu perfil profissional ja esta vinculado a este estabelecimento.",
            [{ text: "OK", onPress: () => router.back() }]
          );
        } else {
          try {
            await affiliate(establishmentId!);
            Alert.alert(
              "Vinculado",
              "Seu perfil profissional foi vinculado a este estabelecimento.",
              [{ text: "OK", onPress: () => router.back() }]
            );
          } catch (affErr: any) {
            const affCode = affErr?.response?.data?.code;
            if (affCode === "PROFESSIONAL_ALREADY_AFFILIATED") {
              Alert.alert(
                "Ja vinculado a outro",
                "Seu perfil profissional ja esta vinculado a outro estabelecimento. Acesse Perfil > Configuracoes para sair do atual antes de vincular a este.",
              );
            } else {
              Alert.alert("Erro", "Nao foi possivel vincular ao estabelecimento.");
            }
          }
        }
      } else {
        const msg =
          error?.response?.data?.message || "Nao foi possivel adicionar o profissional.";
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
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
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
    </KeyboardAvoidingView>
  );
}
