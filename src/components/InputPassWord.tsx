import { ComponentProps, useState } from "react";

import {
  Input as GluestackInput,
  InputField,
  InputSlot,
  InputIcon,
  FormControlLabel,
  FormControlLabelText,
  EyeOffIcon,
  EyeIcon,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  VStack,
  AlertCircleIcon,
} from "@gluestack-ui/themed";



type InputPasswordProps = ComponentProps<typeof InputField> & {
  messageError: string;
  textLabel: string;
};

export function InputPassword(props: InputPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };

  return (
    <VStack mb="$3" w="$full">
      <FormControlLabel>
        <FormControlLabelText>{props.textLabel}</FormControlLabelText>
      </FormControlLabel>

      <GluestackInput
        h="$12"
				w="$full"
        pr="$3"
        borderWidth="$1"
        borderColor="$success500"
        borderRadius="$md"
        variant="outline"
        $focus-borderWidth="$2"
      >
        <InputField
          type={showPassword ? "text" : "password"}
          color="$success950"
          fontFamily="$body"
          autoCapitalize="none"
          {...props}
        />
        <InputSlot onPress={handleState}>
          <InputIcon
            size="lg"
            as={showPassword ? EyeOffIcon : EyeIcon}
            color="$emerald900"
          />
        </InputSlot>
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
