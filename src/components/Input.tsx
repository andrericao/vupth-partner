import { ComponentProps } from "react";

import {
  Input as GluestackInput,
  InputField,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  AlertCircleIcon,
} from "@gluestack-ui/themed";

export type InputProps = {
  icon?: string;
};

type Props = ComponentProps<typeof InputField> & {
  data?: InputProps;
};

export function Input({ data, ...rest }: Props) {
  return (
    <>
      <FormControlLabel>
        <FormControlLabelText>E-mail</FormControlLabelText>
      </FormControlLabel>
      <GluestackInput
        h="$12"
        px="$4"
				w="$full"
        borderWidth="$1"
        borderColor="$success500"
        borderRadius="$md"
        variant="outline"
        $focus-borderWidth="$2"
      >
        <InputField color="$success950" fontFamily="$body" {...rest} />
      </GluestackInput>
      <FormControlError>
        <FormControlErrorIcon as={AlertCircleIcon} />
        <FormControlErrorText>
          Atleast 6 characters are required.
        </FormControlErrorText>
      </FormControlError>
    </>
  );
}
