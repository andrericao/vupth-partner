import { VStack, Heading, Text, Center } from "@gluestack-ui/themed";

export default function ProfessionalQueueScreen() {
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
    </VStack>
  );
}
