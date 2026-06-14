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

type InputFieldProps = ComponentProps<typeof InputField> & {
    textLabel: string;
    messageError: string;
  };

export function Input(props: InputFieldProps) {
  return (
    <VStack mb="$3" w="$full">
      <FormControlLabel>
        <FormControlLabelText>{props.textLabel}</FormControlLabelText>
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
        <InputField color="$success950" fontFamily="$body" autoCorrect={false} autoCapitalize="words" {...props} />
      </GluestackInput>
      <FormControlError>
        <FormControlErrorIcon as={AlertCircleIcon} />
        <FormControlErrorText>{props.messageError}</FormControlErrorText>
      </FormControlError>
    </VStack>
  );
}
