import { VStack, Heading, Text, ScrollView } from "@gluestack-ui/themed";
import { Header } from "@components/Header";

export default function AttendancesScreen() {
  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton />

        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Atendimentos
        </Heading>

        <VStack mt="$6">
          <Text fontFamily="$heading" fontWeight="$bold" mb="$2" color="$coolGray700">
            Em andamento
          </Text>
          <Text fontFamily="$body" color="$coolGray400">
            Nenhum atendimento ativo
          </Text>
        </VStack>

        <VStack mt="$8">
          <Text fontFamily="$heading" fontWeight="$bold" mb="$2" color="$coolGray700">
            Realizados
          </Text>
          <Text fontFamily="$body" color="$coolGray400">
            Em breve — aguardando endpoint de historico
          </Text>
        </VStack>
      </VStack>
    </ScrollView>
  );
}
