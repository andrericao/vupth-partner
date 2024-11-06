import { ComponentProps } from "react";

import {
  Input as GluestackInput,
  InputField,
  InputSlot,
  InputIcon,
	SearchIcon,
} from "@gluestack-ui/themed";

type InputSearchProps = ComponentProps<typeof InputField> 

/* type Props = ComponentProps<typeof InputField> & {
  data?: InputProps;
}; */

export function InputSearch(props: InputSearchProps) {
  return (
    <GluestackInput
      h="$12"
			w="$full"
			mb="$3"
      borderWidth="$1"
      borderColor="$success500"
      borderRadius="$md"
      variant="outline"
      $focus-borderWidth="$2"
    >
      <InputSlot>
        <InputIcon
          size="md"
          as={SearchIcon}
          color="$emerald900"
        />
      </InputSlot>
      <InputField color="$success950" fontFamily="$body" {...props} />
    </GluestackInput>
  );
}
