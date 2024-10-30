import { Input, VStack, InputField, InputSlot, InputIcon } from "@gluestack-ui/themed";

export function Login() {
  return (
    <VStack style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Input mt={350}>
        <InputField color="$amber100" placeholder="Texto aqui" />
        <InputSlot>
          <InputIcon>{/* Some Icon Component */}</InputIcon>
        </InputSlot>
      </Input>
    </VStack>
  );
}
