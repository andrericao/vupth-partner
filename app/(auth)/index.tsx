import { VStack, Heading, Text, Center } from "@gluestack-ui/themed";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { Button } from "@components/Button";

export default function RoleChoiceScreen() {
  return (
    <VStack flex={1} py="$12" px="$6" alignItems="center" justifyContent="center">
      <Header />

      <VStack flex={1} mt="$48" w="$full" space="xl">
        <Heading size="3xl" fontFamily="$heading" textAlign="center">
          Como deseja usar o VUPTH? (OTA ✅)
        </Heading>

        <Text fontFamily="$body" textAlign="center" mt="$4" color="$coolGray500">
          Escolha seu papel para começar
        </Text>

        <Button
          title="Sou dono de estabelecimento"
          onPress={() => router.push("/(auth)/register?role=owner")}
          mt="$8"
        />

        <Button
          title="Sou profissional"
          onPress={() => router.push("/(auth)/register?role=professional")}
          mt="$4"
          bg="$white"
          borderWidth="$1"
          borderColor="$green500"
          $active-bg="$coolGray100"
          textColor="$green500"
        />
      </VStack>
    </VStack>
  );
}
