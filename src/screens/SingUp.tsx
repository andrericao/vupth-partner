import { useState } from "react";

import {
  VStack,
  FormControl,
  Heading,
  FormControlLabel,
  FormControlLabelText,
  InputField,
  InputSlot,
  InputIcon,
  EyeIcon,
  EyeOffIcon,
  FormControlError,
  FormControlErrorText,
  AlertCircleIcon,
  FormControlErrorIcon,
  Button,
  ButtonText,
  SearchIcon,
} from "@gluestack-ui/themed";

import { Input } from "@components/Input";
import { Select } from "@components/Select";
import { InputPassword } from "@components/InputPassWord";

type Props = {

  data: InputProps;

}

export function SingUp() {
  const [isInvalid, setIsInvalid] = useState(false);
  const [inputValue, setInputValue] = useState("");


  const handleSubmit = () => {
    if (inputValue.length < 6) {
      setIsInvalid(true);
    } else {
      setIsInvalid(false);
    }
  };
  return (
    <VStack
        flex={1}
        padding="$6"
        alignItems="center"
        justifyContent="center"
    >
      <FormControl isInvalid={isInvalid}>

        <Heading mb="$12" size="3xl">Cadastrar</Heading>

        <Select />

        <Input
          placeholder="email@empresa.com"
          value={inputValue}
          onChangeText={(inputValue) => setInputValue(inputValue)}
          textLabel="E-mail"
          messageError="Test"
          keyboardType="email-address"
        />

        <InputPassword placeholder="senha" messageError="Oi" textLabel="Senha" />
        <InputPassword placeholder="Confirmar senha" messageError="Oi" textLabel="Confirmar senha" />

        <Button bg="$green500" h="$12" mt="$12" onPress={handleSubmit}>
          <ButtonText>Cadastrar</ButtonText>
        </Button>
      </FormControl>
    </VStack>
  );
}
