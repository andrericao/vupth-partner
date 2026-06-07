import { router } from "expo-router";
import { HStack, Center, Heading } from "@gluestack-ui/themed";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ButtonGoBack } from "@components/ButtonGoBack";

type Props = {
  showBackButton?: boolean;
  onBack?: () => void;
};

export function Header({ showBackButton = false, onBack }: Props) {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <HStack alignItems="center" style={{ paddingTop: insets.top }}>
      {showBackButton && <ButtonGoBack onPress={handleBack} />}
      <Center>
        <Heading size="xl" fontFamily="$heading" color="$green700">
          VUPTH
        </Heading>
      </Center>
    </HStack>
  );
}
