import {
  VStack,
  Heading,
  Text,
  Pressable,
  HStack,
  Divider,
  ScrollView,
} from "@gluestack-ui/themed";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@store/auth.store";
import { cardShadow } from "@lib/styles";
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
      px="$5"
      bg="$white"
      borderRadius="$2xl"
      style={cardShadow}
      $active-bg="$coolGray50"
    >
      <Text fontFamily="$body" fontSize="$md" fontWeight="$medium" color={color}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function ProfessionalProfileScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  const logout = useAuthStore((s) => s.logout);
  const hasOwner = useAuthStore((s) => s.user?.roles?.includes("OWNER"));

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
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

        {/* Seletor de papel: quem acumula PROFESSIONAL + OWNER volta para a
            area do dono. Profissional-so nao ve o botao. Decisao 2026-06-28. */}
        {hasOwner && (
          <VStack mb="$4">
            <MenuItem
              label="Area do dono"
              onPress={() => router.replace("/(owner)/dashboard" as any)}
              color="$green600"
            />
          </VStack>
        )}

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
