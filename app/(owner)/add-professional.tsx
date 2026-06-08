import {
  VStack,
  Heading,
  Text,
  ScrollView,
} from "@gluestack-ui/themed";
import { router, useLocalSearchParams } from "expo-router";
import { Header } from "@components/Header";
import { Button } from "@components/Button";

export default function AddProfessionalScreen() {
  const { establishmentId } = useLocalSearchParams<{ establishmentId: string }>();

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack flex={1} py="$12" px="$6">
        <Header showBackButton />

        <VStack flex={1} justifyContent="center" px="$2">
          <Heading size="2xl" fontFamily="$heading" mb="$4">
            Adicionar Profissional
          </Heading>

          <Text fontFamily="$body" color="$coolGray600" mb="$2" fontSize="$md">
            Profissionais se cadastram pelo app e solicitam vinculacao ao seu
            estabelecimento.
          </Text>

          <Text fontFamily="$body" color="$coolGray500" mb="$6" fontSize="$sm">
            Voce pode aceitar ou recusar as solicitacoes na tela de vinculacoes.
          </Text>

          <VStack
            bg="$coolGray50"
            p="$4"
            borderRadius="$lg"
            borderWidth="$1"
            borderColor="$coolGray200"
            mb="$6"
          >
            <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray700" mb="$2">
              Como funciona:
            </Text>
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray600" mb="$1">
              1. O profissional se cadastra no app como profissional
            </Text>
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray600" mb="$1">
              2. Ele busca seu estabelecimento pelo nome
            </Text>
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray600" mb="$1">
              3. Envia uma solicitacao de vinculacao
            </Text>
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray600">
              4. Voce aceita ou recusa aqui
            </Text>
          </VStack>

          <Button
            title="Ver Solicitacoes"
            onPress={() =>
              router.replace({
                pathname: "/(owner)/affiliations",
                params: { establishmentId: establishmentId ?? "" },
              } as any)
            }
            bg="$green500"
            $active-bg="$green600"
          />

          <Button
            title="Voltar"
            onPress={() => router.back()}
            bg="$coolGray300"
            $active-bg="$coolGray400"
            textColor="$coolGray800"
            mt="$2"
          />
        </VStack>
      </VStack>
    </ScrollView>
  );
}
