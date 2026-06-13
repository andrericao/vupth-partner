import { VStack, Heading, Text, ScrollView } from "@gluestack-ui/themed";
import { Header } from "@components/Header";

type Props = {
  title: string;
  onBack?: () => void;
};

export function ComingSoon({ title, onBack }: Props) {
  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton onBack={onBack} />

        <Heading mt="$8" size="2xl" fontFamily="$heading">
          {title}
        </Heading>

        <VStack flex={1} alignItems="center" justifyContent="center" mt="$12">
          <Text fontSize="$6xl">🚧</Text>
          <Text
            fontFamily="$heading"
            fontWeight="$bold"
            fontSize="$lg"
            color="$coolGray700"
            mt="$4"
            textAlign="center"
          >
            Em desenvolvimento
          </Text>
          <Text
            fontFamily="$body"
            color="$coolGray500"
            mt="$2"
            textAlign="center"
          >
            Esta funcionalidade ainda falta implementar.{"\n"}Em breve estara
            disponivel.
          </Text>
        </VStack>
      </VStack>
    </ScrollView>
  );
}
