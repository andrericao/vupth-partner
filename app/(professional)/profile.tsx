import {
  VStack,
  Heading,
  Text,
  Pressable,
  HStack,
  Divider,
  ScrollView,
} from "@gluestack-ui/themed";
import { router } from "expo-router";
import { useAuthStore } from "@store/auth.store";
import { useProfessionalStore } from "@store/professional.store";
import { Header } from "@components/Header";

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

export default function ProfessionalProfileScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)" as any);
  };

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack flex={1} py="$12" px="$6">
        <Header />

        <VStack mt="$8" mb="$6">
          <Heading size="2xl" fontFamily="$heading">
            {professional?.name ?? "Profissional"}
          </Heading>
          <Text fontFamily="$body" color="$coolGray500" mt="$1">
            {professional?.specialty ?? ""}
          </Text>
          {professional?.establishment_name && (
            <Text fontFamily="$body" color="$green600" mt="$1">
              {professional.establishment_name}
            </Text>
          )}
        </VStack>

        <Divider mb="$4" />

        <VStack space="sm">
          <MenuItem
            label="Atendimentos"
            onPress={() => router.push("/(professional)/attendances" as any)}
          />
          <MenuItem
            label="Relatorios"
            onPress={() => router.push("/(professional)/reports" as any)}
          />
          <MenuItem
            label="Meus Servicos"
            onPress={() => router.push("/(professional)/my-services" as any)}
          />
          <MenuItem
            label="Configuracoes"
            onPress={() => router.push("/(professional)/settings" as any)}
          />
        </VStack>

        <VStack mt="$8">
          <MenuItem
            label="Sair"
            onPress={handleLogout}
            color="$red500"
          />
        </VStack>
      </VStack>
    </ScrollView>
  );
}
