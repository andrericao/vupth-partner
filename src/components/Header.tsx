import { router } from "expo-router";
import { HStack, Center, Heading } from "@gluestack-ui/themed";
import { ButtonGoBack } from "@components/ButtonGoBack";

type Props = {
  showBackButton?: boolean;
};

export function Header({ showBackButton = false }: Props) {
  return (
    <HStack alignItems="center">
      {showBackButton && <ButtonGoBack onPress={() => router.back()} />}
      <Center>
        <Heading size="xl" fontFamily="$heading" color="$green700">
          VUPTH
        </Heading>
      </Center>
    </HStack>
  );
}
