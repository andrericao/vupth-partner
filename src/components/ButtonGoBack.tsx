import { ComponentProps } from "react";
import {
  Button as GlueStackButton,
  ButtonGroup,
  ButtonIcon,
  ChevronLeftIcon,
} from "@gluestack-ui/themed";

type ButtonGoBackProps = ComponentProps<typeof GlueStackButton>;

export function ButtonGoBack(props: ButtonGoBackProps) {
  return (
    <ButtonGroup flex={1}>
      <GlueStackButton
        alignItems="center"
        justifyContent="center"
        rounded={18}
        w={39}
        h={39}
        bg="$green500"
        {...props}
      >
        <ButtonIcon borderRadius={30} size="xl" as={ChevronLeftIcon} />
      </GlueStackButton>
    </ButtonGroup>
  );
}
