import {
  FormControlLabel,
  FormControlLabelText,
  Select as SelectGlueStack,
  SelectTrigger,
  SelectPortal,
  SelectInput,
  SelectIcon,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectItem,
  ChevronDownIcon,
} from "@gluestack-ui/themed";

export function SelectService() {
  return (
    <SelectGlueStack mb="$3">
      <FormControlLabel>
        <FormControlLabelText>Tipo de Loja</FormControlLabelText>
      </FormControlLabel>
      <SelectTrigger
        w="$full"
        h="$12"
        pr="$3"
        borderWidth="$1"
        borderColor="$success500"
        borderRadius="$md"
        variant="outline"
        $focus-borderWidth="$2"
      >
        <SelectInput placeholder="Barbearia, Manicure etc" />
        <SelectIcon as={ChevronDownIcon} />
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop />
        <SelectContent>
          <SelectDragIndicatorWrapper>
            <SelectDragIndicator />
          </SelectDragIndicatorWrapper>
          <SelectItem label="Barbearia" value="barbearia" />
          <SelectItem label="Manicure" value="manicure" />
          <SelectItem label="Salão de Beleza" value="salao_de_beleza" />
          <SelectItem label="Sobrancelha" value="sobrancelha" />
        </SelectContent>
      </SelectPortal>
    </SelectGlueStack>
  );
}
