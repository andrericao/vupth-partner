import { useEffect } from "react";
import { BackHandler } from "react-native";
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

  useEffect(() => {
    if (!showBackButton) return;

    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [showBackButton, onBack]);

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
