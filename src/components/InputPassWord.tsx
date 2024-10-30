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
  AlertCircleIcon,
} from "@gluestack-ui/themed";

export type InputProps = {
  icon?: string;
};

type Props = ComponentProps<typeof InputField> & {
  data?: InputProps;
};

export function InputPassword({ data, ...rest }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };

  return (
    <>
      <FormControlLabel>
        <FormControlLabelText>Senha</FormControlLabelText>
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
        <InputField
          type={showPassword ? "text" : "password"}
          color="$success950"
          fontFamily="$body"
          {...rest}
        />
        <InputSlot onPress={handleState}>
          <InputIcon
            size="xl"
            as={showPassword ? EyeOffIcon : EyeIcon}
            color="$emerald900"
          />
        </InputSlot>
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
