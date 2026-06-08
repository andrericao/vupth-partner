import { VStack, Heading, Text, ScrollView, Divider } from "@gluestack-ui/themed";
import { Alert } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { Button } from "@components/Button";
import { useProfessionalStore } from "@store/professional.store";
import { useAuthStore } from "@store/auth.store";

export default function ProfessionalSettingsScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  const user = useAuthStore((s) => s.user);

  const handleComingSoon = () => {
    Alert.alert("Em breve", "Esta funcionalidade sera implementada em breve.");
  };

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton onBack={() => router.navigate("/(professional)/profile" as any)} />

        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Configuracoes
        </Heading>

        <VStack mt="$6" space="md">
          <VStack bg="$white" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200">
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
              Nome
            </Text>
            <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900" mt="$1">
              {professional?.name ?? "—"}
            </Text>
            <Button title="Editar" onPress={handleComingSoon} bg="$coolGray200" textColor="$coolGray700" h="$9" mt="$2" />
          </VStack>

          <VStack bg="$white" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200">
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
              E-mail
            </Text>
            <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900" mt="$1">
              {user?.email ?? "—"}
            </Text>
            <Button title="Editar" onPress={handleComingSoon} bg="$coolGray200" textColor="$coolGray700" h="$9" mt="$2" />
          </VStack>

          <VStack bg="$white" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200">
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
              Senha
            </Text>
            <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900" mt="$1">
              ********
            </Text>
            <Button title="Alterar" onPress={handleComingSoon} bg="$coolGray200" textColor="$coolGray700" h="$9" mt="$2" />
          </VStack>

          <Divider my="$2" />

          <VStack bg="$coolGray50" p="$4" borderRadius="$lg" borderWidth="$1" borderColor="$coolGray200">
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
              Estabelecimento
            </Text>
            <Text fontFamily="$heading" fontWeight="$bold" color={professional?.establishment_name ? "$green700" : "$coolGray400"} mt="$1">
              {professional?.establishment_name ?? "Nao vinculado"}
            </Text>
            {!professional?.establishment_id && (
              <Button
                title="Buscar Estabelecimento"
                onPress={() => router.push("/(professional)/find-establishment" as any)}
                bg="$green500"
                $active-bg="$green600"
                h="$9"
                mt="$2"
              />
            )}
          </VStack>
        </VStack>
      </VStack>
    </ScrollView>
  );
}
