import { useEffect } from "react";
import { BackHandler } from "react-native";
import { router, useSegments } from "expo-router";
import { HStack, Heading } from "@gluestack-ui/themed";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ButtonGoBack } from "@components/ButtonGoBack";
import { RoleIcon } from "@components/RoleIcon";

type Props = {
  showBackButton?: boolean;
  onBack?: () => void;
  /**
   * QA Andre 2026-07-22: "apenas um icone por tela". Telas que ja tem o icone
   * do menu (banco) escondem a silhueta do papel para nao empilhar dois icones
   * a direita. Default true (demais telas ficam como estao).
   */
  showRoleIcon?: boolean;
};

// Papel ativo deduzido do grupo de rota atual — define qual silhueta exibir
// (sempre no mesmo lugar, so muda o desenho). Ajuda no teste a distinguir a
// sessao do estabelecimento (owner) da do profissional.
const ROLE_BY_SEGMENT: Record<string, "owner" | "professional"> = {
  "(owner)": "owner",
  "(professional)": "professional",
};

export function Header({ showBackButton = false, onBack, showRoleIcon = true }: Props) {
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
    // handleBack so depende de onBack (ja listado); router e estavel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBackButton, onBack]);

  return (
    // [new-design] Cabecalho clean: marca "VUPTH" a esquerda (verde escuro,
    // Poppins) e a figurinha do papel/tipo a direita. O titulo da tela
    // ("Minha fila" etc.) e renderizado por cada tela logo abaixo.
    <HStack
      alignItems="center"
      justifyContent="space-between"
      style={{ paddingTop: insets.top }}
    >
      <HStack alignItems="center" space="sm">
        {showBackButton && <ButtonGoBack onPress={handleBack} />}
        <Heading size="lg" fontFamily="$heading" color="$green700" letterSpacing="$lg">
          VUPTH
        </Heading>
      </HStack>
      {showRoleIcon && role && <RoleIcon role={role} />}
    </HStack>
  );
}
