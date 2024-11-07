import { ComponentProps } from "react";

import {
  Input as GluestackInput,
  InputField,
  InputSlot,
  InputIcon,
  SearchIcon,
  VStack,
  FormControlLabel,
  FormControlLabelText,
} from "@gluestack-ui/themed";

type InputSearchProps = ComponentProps<typeof InputField> & {
  textLabel: string;
}

export function InputSearch(props: InputSearchProps) {
  return (
    <VStack mb="$3" w="$full">
      <FormControlLabel>
        <FormControlLabelText>{props.textLabel}</FormControlLabelText>
      </FormControlLabel>
      <GluestackInput
        h="$12"
        w="$full"
        mb="$3"
        px="$3"
        borderWidth="$1"
        borderColor="$success500"
        borderRadius="$md"
        variant="outline"
        $focus-borderWidth="$2"
      >
        <InputSlot>
          <InputIcon size="md" as={SearchIcon} color="$emerald900" />
        </InputSlot>
        <InputField color="$success950" fontFamily="$body" {...props} />
      </GluestackInput>
    </VStack>
  );
}
