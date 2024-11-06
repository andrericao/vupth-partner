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

export function Select() {
  return (
    <SelectGlueStack mb="$3">
			<FormControlLabel>
        <FormControlLabelText>Cargo</FormControlLabelText>
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
        <SelectInput placeholder="Selecionar opção" />
        <SelectIcon as={ChevronDownIcon} />
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop />
        <SelectContent>
          <SelectDragIndicatorWrapper>
            <SelectDragIndicator />
          </SelectDragIndicatorWrapper>
          <SelectItem label="Proprietário" value="owner" />
          <SelectItem label="Administrador" value="administrator" />
          <SelectItem label="Profissional" value="professional" />
        </SelectContent>
      </SelectPortal>
    </SelectGlueStack>
  );
}
