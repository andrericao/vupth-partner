import { VStack, Heading, Text, ScrollView } from "@gluestack-ui/themed";
import { Header } from "@components/Header";

export default function MyServicesScreen() {
  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton />

        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Meus Servicos
        </Heading>

        <Text fontFamily="$body" color="$coolGray400" mt="$6" textAlign="center">
          Em breve — adicionar e gerenciar seus servicos
        </Text>
      </VStack>
    </ScrollView>
  );
}
