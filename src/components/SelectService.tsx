import {
  FormControlLabel,
  FormControlLabelText,
  VStack,
  Pressable,
  Text,
} from "@gluestack-ui/themed";

const SERVICE_TYPES = [
  { label: "Barbearia", value: "BARBER" },
  { label: "Salão de Beleza", value: "BEAUTY_SALON" },
  { label: "Manicure / Pedicure", value: "NAIL_SALON" },
  { label: "Sobrancelha", value: "EYEBROW" },
  { label: "SPA", value: "SPA" },
  { label: "Clínica", value: "CLINIC" },
] as const;

type Props = {
  value?: string;
  onValueChange?: (value: string) => void;
};

export function SelectService({ value, onValueChange }: Props) {
  return (
    <VStack mb="$3" w="$full">
      <FormControlLabel>
        <FormControlLabelText>Tipo de Loja</FormControlLabelText>
      </FormControlLabel>
      <VStack space="xs" mt="$1">
        {SERVICE_TYPES.map((type) => {
          const isSelected = value === type.value;
          return (
            <Pressable
              key={type.value}
              onPress={() => onValueChange?.(type.value)}
              bg={isSelected ? "$green500" : "$coolGray100"}
              py="$2.5"
              px="$4"
              borderRadius="$md"
              borderWidth="$1"
              borderColor={isSelected ? "$green600" : "$coolGray200"}
            >
              <Text
                fontFamily="$body"
                color={isSelected ? "$white" : "$coolGray700"}
                textAlign="center"
              >
                {type.label}
              </Text>
            </Pressable>
          );
        })}
      </VStack>
    </VStack>
  );
}
