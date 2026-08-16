import { ComponentProps } from "react";
import {
  Button as GlueStackButton,
  ButtonText,
  ButtonSpinner,
} from "@gluestack-ui/themed";

type ButtonProps = ComponentProps<typeof GlueStackButton> & {
  title?: string;
  isLoading?: boolean;
  textColor?: string;
};

// [marca-vupth] Botao com presenca: pilula (rounded full), sombra suave e texto
// Archivo. Sombra via style RN (confiavel cross-platform).
// Fundo default vira $forest (nao $brandGreen): este componente aceita
// bg/textColor por prop em muitas chamadas (ex.: bg="$red500" p/ rejeitar, sem
// override de texto — confia no branco default). Trocar o default pra
// $brandGreen quebraria essas chamadas (texto claro sobre fundo claro). $forest
// e so uma versao mais escura do verde antigo — troca segura, texto branco
// continua legivel. O par brilhante brandGreen+forest do Pencil ja existe em
// src/components/brand/Button.tsx, pra telas migradas explicitamente.
const btnShadow = {
  shadowColor: "#1A281A",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.18,
  shadowRadius: 10,
  elevation: 4,
};

export function Button(props: ButtonProps) {
  return (
    <GlueStackButton
      bg="$forest"
      h={54}
      mt="$9"
      rounded="$full"
      style={btnShadow}
      $active-bg="$forestSoft"
      disabled={props.isLoading}
      {...props}
    >
      {props.isLoading ? (
        <ButtonSpinner color="$white" />
      ) : (
        <ButtonText fontFamily="$heading" fontSize="$md" color={props.textColor ?? "$white"}>
          {props.title}
        </ButtonText>
      )}
    </GlueStackButton>
  );
}
