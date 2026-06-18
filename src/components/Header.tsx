import { useEffect } from "react";
import { BackHandler } from "react-native";
import { router, useSegments } from "expo-router";
import { HStack, Center, Heading } from "@gluestack-ui/themed";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ButtonGoBack } from "@components/ButtonGoBack";
import { RoleIcon } from "@components/RoleIcon";

type Props = {
  showBackButton?: boolean;
  onBack?: () => void;
};

// Papel ativo deduzido do grupo de rota atual — define qual silhueta exibir
// (sempre no mesmo lugar, so muda o desenho). Ajuda no teste a distinguir a
// sessao do estabelecimento (owner) da do profissional.
const ROLE_BY_SEGMENT: Record<string, "owner" | "professional"> = {
  "(owner)": "owner",
  "(professional)": "professional",
};

export function Header({ showBackButton = false, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const role = segments
    .map((s) => ROLE_BY_SEGMENT[s as string])
    .find((r): r is "owner" | "professional" => Boolean(r));

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
    // Sem onBack e sem para onde voltar: nao faz nada.
    // O botao voltar nunca pode deslogar (cair em /(auth)).
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
      {role && (
        <HStack ml="auto" alignItems="center">
          <RoleIcon role={role} />
        </HStack>
      )}
    </HStack>
  );
}
