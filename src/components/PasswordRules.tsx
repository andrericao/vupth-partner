import { HStack, VStack, Text } from "@gluestack-ui/themed";
import { Ionicons } from "@expo/vector-icons";
import { PasswordRule } from "@lib/passwordValidation";

// Checklist de regras de senha AO VIVO (espelhado do front-client): cada regra
// mostra check verde quando cumprida e x vermelho quando nao. Use junto de
// getPasswordRules(password) no cadastro.
export function PasswordRules({ rules }: { rules: PasswordRule[] }) {
  return (
    <VStack space="xs" mt="$1" mb="$3">
      {rules.map((rule) => (
        <HStack key={rule.label} alignItems="center" space="xs">
          <Ionicons
            name={rule.passed ? "checkmark-circle" : "close-circle"}
            size={14}
            color={rule.passed ? "#00B37E" : "#E63946"}
          />
          <Text
            fontFamily="$body"
            fontSize="$xs"
            color={rule.passed ? "$green600" : "$red500"}
          >
            {rule.label}
          </Text>
        </HStack>
      ))}
    </VStack>
  );
}
