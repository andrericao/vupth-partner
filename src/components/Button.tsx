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

// [new-design] Botao com presenca: pilula (rounded full), sombra suave e texto
// Poppins. Sombra via style RN (confiavel cross-platform).
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
      bg="$green500"
      h={54}
      mt="$9"
      rounded="$full"
      style={btnShadow}
      $active-bg="$green600"
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
