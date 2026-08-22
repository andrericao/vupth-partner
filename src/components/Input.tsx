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
        bg="$white"
        borderWidth="$1"
        borderColor="$coolGray300"
        borderRadius="$xl"
        variant="outline"
        $focus-borderWidth="$2"
        $focus-borderColor="$forest"
      >
        <InputField color="$coolGray900" fontFamily="$body" autoCorrect={false} autoCapitalize="words" {...props} />
      </GluestackInput>
      <FormControlError>
        <FormControlErrorIcon as={AlertCircleIcon} />
        <FormControlErrorText>{props.messageError}</FormControlErrorText>
      </FormControlError>
    </VStack>
  );
}
