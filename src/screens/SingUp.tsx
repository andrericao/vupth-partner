import { useState } from "react";

import {
  VStack,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Input,
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

import { InputSearch } from "@components/InputSearch";
import { InputPassword } from "@components/InputPassWord";
import { Input as InputAndre } from "@components/Input";

export function SingUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };

  const handleSubmit = () => {
    if (inputValue.length < 6) {
      setIsInvalid(true);
    } else {
      setIsInvalid(false);
    }
  };
  return (
    <VStack
      style={{
        flex: 1,
        padding: 15,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FormControl isInvalid={isInvalid}>

        <InputSearch />
        <InputPassword />
        <InputAndre
        value={inputValue}
        onChangeText={(inputValue) => setInputValue(inputValue)}
        keyboardType="email-address" 
        />
      <Button bg="$green500" h="$12" mt="$12" onPress={handleSubmit}>
        <ButtonText>Cadastrar</ButtonText>
      </Button>
      </FormControl>
    </VStack>
  );
}
