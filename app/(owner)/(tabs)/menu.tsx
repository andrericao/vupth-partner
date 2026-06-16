import { useState } from "react";
import {
  VStack,
  HStack,
  FormControl,
  Heading,
  Text,
  Pressable,
  Divider,
  ScrollView,
} from "@gluestack-ui/themed";
import { Alert } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { Button } from "@components/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { useProfessionalStore } from "@store/professional.store";
import { useAuthStore } from "@store/auth.store";
import { getApiErrorMessage } from "@lib/api";

type MenuItemProps = {
  label: string;
  onPress: () => void;
  color?: string;
};

function MenuItem({ label, onPress, color = "$coolGray900" }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      py="$4"
      px="$4"
      bg="$white"
      borderRadius="$md"
      borderWidth="$1"
      borderColor="$coolGray200"
      $active-bg="$coolGray50"
    >
      <Text fontFamily="$body" fontSize="$md" color={color}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function OwnerMenuScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const resetEstablishment = useEstablishmentStore((s) => s.reset);
  const updateGeneralInfos = useEstablishmentStore((s) => s.updateGeneralInfos);
  const resetProfessional = useProfessionalStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isProfessional = user?.roles?.includes("PROFESSIONAL");

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const startEditName = () => {
    setNameValue(establishment?.name ?? "");
    setEditingName(true);
  };

  const handleSaveName = async () => {
    const value = nameValue.trim();
    if (value.length < 2 || !establishment?.id) {
      Alert.alert("Nome invalido", "Informe um nome valido para o estabelecimento.");
      return;
    }
    setIsSavingName(true);
    try {
      await updateGeneralInfos(establishment.id, { name: value });
      setEditingName(false);
      Alert.alert("Nome atualizado", "O nome do estabelecimento foi alterado.");
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Nao foi possivel alterar o nome."));
    } finally {
      setIsSavingName(false);
    }
  };

  const handleLeaveEstablishment = () => {
    Alert.alert(
      "Sair do Estabelecimento",
      "Voce sera desvinculado deste estabelecimento. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair do Estabelecimento",
          style: "destructive",
          onPress: async () => {
            resetEstablishment();
            resetProfessional();
            router.replace("/(owner)/onboarding/establishment" as any);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair da conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)" as any);
        },
      },
    ]);
  };

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack flex={1} pb="$6" px="$6">
        <Header />

        <VStack mt="$8" mb="$6">
          {editingName ? (
            <FormControl>
              <Input
                textLabel="Nome do estabelecimento"
                placeholder="Nome do estabelecimento"
                messageError=""
                value={nameValue}
                onChangeText={setNameValue}
                autoCapitalize="words"
              />
              <HStack space="sm">
                <Button
                  title="Cancelar"
                  onPress={() => setEditingName(false)}
                  bg="$coolGray200"
                  textColor="$coolGray700"
                  h="$9"
                  flex={1}
                />
                <Button
                  title="Salvar"
                  onPress={handleSaveName}
                  isLoading={isSavingName}
                  bg="$green500"
                  $active-bg="$green600"
                  h="$9"
                  flex={1}
                />
              </HStack>
            </FormControl>
          ) : (
            <>
              <HStack alignItems="center" justifyContent="space-between">
                <Heading size="2xl" fontFamily="$heading" flex={1}>
                  {establishment?.name ?? "Meu Estabelecimento"}
                </Heading>
                {establishment?.id && (
                  <Pressable onPress={startEditName} px="$2" py="$1">
                    <Text fontFamily="$body" fontSize="$sm" color="$blue600">
                      Editar nome
                    </Text>
                  </Pressable>
                )}
              </HStack>
              <Text fontFamily="$body" color="$coolGray500" mt="$1">
                {establishment?.service_type ?? ""}
              </Text>
              {isProfessional && (
                <Text fontFamily="$body" color="$green600" mt="$1">
                  Tambem profissional
                </Text>
              )}
            </>
          )}
        </VStack>

        <Divider mb="$4" />

        <VStack space="sm">
          {establishment?.id && (
            <>
              <MenuItem
                label="Adicionar Profissional"
                onPress={() =>
                  router.push({
                    pathname: isProfessional
                      ? "/(owner)/add-professional"
                      : "/(owner)/onboarding/also-professional",
                    params: { establishmentId: establishment.id },
                  } as any)
                }
              />

              <MenuItem
                label="Solicitacoes de Vinculacao"
                onPress={() =>
                  router.push({
                    pathname: "/(owner)/affiliations",
                    params: { establishmentId: establishment.id },
                  } as any)
                }
              />

              <MenuItem
                label="Adicionar Servico"
                onPress={() =>
                  router.push({
                    pathname: "/(owner)/add-service",
                    params: { establishmentId: establishment.id },
                  } as any)
                }
              />

              <MenuItem
                label="Ver Filas"
                onPress={() =>
                  router.push({
                    pathname: "/(owner)/queues",
                    params: { establishmentId: establishment.id },
                  } as any)
                }
              />
            </>
          )}

          <MenuItem
            label="Dados Pessoais"
            onPress={() =>
              router.push({
                pathname: "/(owner)/coming-soon",
                params: { title: "Dados Pessoais" },
              } as any)
            }
          />

          {establishment?.id && (
            <MenuItem
              label="Dados do Estabelecimento"
              onPress={() => router.push("/(owner)/onboarding/address" as any)}
            />
          )}

          <MenuItem
            label="Atendimentos"
            onPress={() => router.push("/(owner)/attendances" as any)}
          />

          <MenuItem
            label="Relatorios"
            onPress={() => router.push("/(owner)/reports" as any)}
          />

        </VStack>

        <VStack mt="$8" space="sm">
          {establishment?.id && (
            <MenuItem
              label="Sair do Estabelecimento"
              onPress={handleLeaveEstablishment}
              color="$amber700"
            />
          )}

          <MenuItem
            label="Sair da Conta"
            onPress={handleLogout}
            color="$red500"
          />
        </VStack>
      </VStack>
    </ScrollView>
  );
}
