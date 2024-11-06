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

type InputProps = ComponentProps<typeof InputField> & {
  textLabel: string;
  messageError: string
};

export function Input(props: InputProps) {
  return (
    <VStack mb="$3">
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
        <InputField color="$success950" fontFamily="$body" {...props} />
      </GluestackInput>
      <FormControlError>
        <FormControlErrorIcon as={AlertCircleIcon} />
        <FormControlErrorText>
          {props.messageError}
        </FormControlErrorText>
      </FormControlError>
    </VStack>
  );
}
