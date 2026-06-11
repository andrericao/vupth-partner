import { useState } from "react";
import {
  VStack,
  FormControl,
  Heading,
  Text,
  ScrollView,
} from "@gluestack-ui/themed";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
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

export default function AddProfessionalScreen() {
  const { establishmentId } = useLocalSearchParams<{ establishmentId: string }>();
  const user = useAuthStore((s) => s.user);
  const isProfessional = user?.roles?.includes("PROFESSIONAL");

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("BARBER");
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const quickCreateProfessional = useEstablishmentStore(
    (s) => s.quickCreateProfessional
  );
  const refreshToken = useAuthStore((s) => s.refreshToken);

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
        "Profissional criado",
        `${result.name} vinculado ao estabelecimento!`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      const code = error?.response?.data?.code;

      if (code === "USER_ALREADY_PROFESSIONAL" || error?.response?.status === 409) {
        try {
          await useProfessionalStore.getState().affiliate(establishmentId!);
          await refreshToken();
          Alert.alert(
            "Vinculado",
            "Seu perfil profissional foi vinculado a este estabelecimento.",
            [{ text: "OK", onPress: () => router.back() }]
          );
        } catch (affErr: any) {
          const affCode = affErr?.response?.data?.code;
          if (affCode === "PROFESSIONAL_ALREADY_AFFILIATED") {
            Alert.alert(
              "Tudo certo",
              "Seu perfil profissional ja esta vinculado a este estabelecimento.",
              [{ text: "OK", onPress: () => router.back() }]
            );
          } else {
            Alert.alert("Erro", "Nao foi possivel vincular ao estabelecimento.");
          }
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
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton />

        <Heading mt="$8" size="2xl" fontFamily="$heading" mb="$4">
          Adicionar Profissional
        </Heading>

        {!isProfessional ? (
          <FormControl isInvalid={isInvalid}>
            <Text fontFamily="$body" color="$coolGray600" mb="$4" fontSize="$sm">
              Crie seu perfil profissional para atender clientes neste
              estabelecimento.
            </Text>

            <Input
              textLabel="Seu nome"
              placeholder="Ex: João Silva"
              messageError="Nome obrigatório"
              value={name}
              onChangeText={setName}
            />

            <Heading size="md" fontFamily="$heading" mt="$2" mb="$2">
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
              title="Criar Profissional"
              onPress={handleQuickCreate}
              isLoading={isLoading}
              bg="$green500"
              $active-bg="$green600"
            />
          </FormControl>
        ) : (
          <VStack>
            <Text fontFamily="$body" color="$coolGray600" mb="$4" fontSize="$md">
              Voce ja possui perfil profissional. Para adicionar outros
              profissionais, eles devem se cadastrar pelo app e solicitar
              vinculacao ao seu estabelecimento.
            </Text>

            <VStack
              bg="$coolGray50"
              p="$4"
              borderRadius="$lg"
              borderWidth="$1"
              borderColor="$coolGray200"
              mb="$6"
            >
              <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray700" mb="$2">
                Como funciona:
              </Text>
              <Text fontFamily="$body" fontSize="$sm" color="$coolGray600" mb="$1">
                1. O profissional se cadastra no app
              </Text>
              <Text fontFamily="$body" fontSize="$sm" color="$coolGray600" mb="$1">
                2. Ele busca seu estabelecimento pelo nome
              </Text>
              <Text fontFamily="$body" fontSize="$sm" color="$coolGray600" mb="$1">
                3. Envia uma solicitacao de vinculacao
              </Text>
              <Text fontFamily="$body" fontSize="$sm" color="$coolGray600">
                4. Voce aceita ou recusa nas solicitacoes
              </Text>
            </VStack>

            <Button
              title="Ver Solicitacoes"
              onPress={() =>
                router.replace({
                  pathname: "/(owner)/affiliations",
                  params: { establishmentId: establishmentId ?? "" },
                } as any)
              }
              bg="$green500"
              $active-bg="$green600"
            />
          </VStack>
        )}
      </VStack>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
