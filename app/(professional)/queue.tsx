import { VStack, Heading, Text, Center } from "@gluestack-ui/themed";
import { router } from "expo-router";
import { Button } from "@components/Button";
import { useAuthStore } from "@store/auth.store";

export default function ProfessionalQueueScreen() {
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)" as any);
  };

  return (
    <VStack flex={1} py="$12" px="$6">
      <Heading size="2xl" fontFamily="$heading">
        Minha Fila
      </Heading>
      <Center flex={1}>
        <Text fontFamily="$body" color="$coolGray500">
          Fila do profissional com polling aparecerá aqui
        </Text>
      </Center>
      <Button
        title="Sair"
        onPress={handleLogout}
        bg="$coolGray400"
        $active-bg="$coolGray500"
      />
    </VStack>
  );
}
