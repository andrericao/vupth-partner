import { Center, Spinner, Text, VStack } from "@gluestack-ui/themed";
import { Button } from "@components/Button";

// Tela do portao de readiness / cold start (ver src/lib/readiness.ts). Enquanto
// o backend acorda (Render Free, ~50s), seguramos o app aqui — login/cadastro
// so liberam apos UP. (Backlog #2: trocar o Spinner pela animacao de abertura.)
type Props = {
  failed?: boolean;
  onRetry?: () => void;
};

export function ServerWarmup({ failed, onRetry }: Props) {
  return (
    <Center flex={1} px="$8">
      <VStack space="lg" alignItems="center">
        {failed ? (
          <>
            <Text fontFamily="$heading" fontSize="$lg" color="$coolGray700" textAlign="center">
              Nao foi possivel conectar ao servidor
            </Text>
            <Text fontFamily="$body" fontSize="$sm" color="$coolGray500" textAlign="center">
              O servidor pode estar iniciando. Tente novamente em alguns segundos.
            </Text>
            {onRetry && <Button title="Tentar de novo" onPress={onRetry} />}
          </>
        ) : (
          <>
            <Spinner size="large" color="$green500" />
            <Text fontFamily="$body" fontSize="$md" color="$coolGray600" textAlign="center">
              Preparando servidor...
            </Text>
          </>
        )}
      </VStack>
    </Center>
  );
}
