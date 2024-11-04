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
  VStack,
} from "@gluestack-ui/themed";

type Props = ComponentProps<typeof InputField> & {
  textLabel: string;
  messageError: string
};

export function Input({ textLabel, messageError, ...rest }: Props) {
  return (
    <VStack mb="$3">
      <FormControlLabel>
        <FormControlLabelText>{textLabel}</FormControlLabelText>
      </FormControlLabel>
      <GluestackInput
        h="$12"
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
          {messageError}
        </FormControlErrorText>
      </FormControlError>
    </VStack>
  );
}
