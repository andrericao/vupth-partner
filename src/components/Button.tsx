import { ComponentProps } from "react";
import {
  Button as GlueStackButton,
  ButtonText,
  ButtonSpinner,
  ArrowRightIcon,
} from "@gluestack-ui/themed";

type ButtonProps = ComponentProps<typeof GlueStackButton> & {
  title?: string;
  isLoading?: boolean;
};

export function Button(props: ButtonProps) {
  return (
    <GlueStackButton
      bg="$green500"
      h="$12"
      mt="$9"
      $active-bg="$green600"
      disabled={props.isLoading}
      {...props}
    >
      {props.isLoading ? (
        <ButtonSpinner color="$white" />
      ) : (
        <ButtonText fontFamily="$body" color="$white" mr="$3">{props.title}</ButtonText>
        
      )}
    </GlueStackButton>
  );
}
