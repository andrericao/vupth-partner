import { router } from "expo-router";
import { HStack, Center, Heading } from "@gluestack-ui/themed";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ButtonGoBack } from "@components/ButtonGoBack";

type Props = {
  showBackButton?: boolean;
};

export function Header({ showBackButton = false }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <HStack alignItems="center" style={{ paddingTop: insets.top }}>
      {showBackButton && <ButtonGoBack onPress={() => router.back()} />}
      <Center>
        <Heading size="xl" fontFamily="$heading" color="$green700">
          VUPTH
        </Heading>
      </Center>
    </HStack>
  );
}
