import { VStack, Heading, Text, Center } from "@gluestack-ui/themed";

export default function OwnerDashboardScreen() {
  return (
    <VStack flex={1} py="$12" px="$6">
      <Heading size="2xl" fontFamily="$heading">
        Dashboard
      </Heading>
      <Center flex={1}>
        <Text fontFamily="$body" color="$coolGray500">
          Fila em tempo real aparecerá aqui
        </Text>
      </Center>
    </VStack>
  );
}
