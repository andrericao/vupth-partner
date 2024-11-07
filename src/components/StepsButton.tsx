import { ComponentProps } from "react";
import {
  Button as GlueStackButton,
  ButtonText,
  ButtonSpinner,
  ButtonIcon,
  ArrowRightIcon,
} from "@gluestack-ui/themed";

type StepButtonProps = ComponentProps<typeof GlueStackButton> & {
  title?: string;
  isLoading?: boolean;
};

export function StepsButton(props: StepButtonProps) {
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
        <ButtonText fontFamily="$body" color="$white" mr="$3">
          {props.title}
        </ButtonText>
      )}
      <ButtonIcon as={ArrowRightIcon} />
    </GlueStackButton>
  );
}
