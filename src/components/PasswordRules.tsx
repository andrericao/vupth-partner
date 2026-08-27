import { View, Text } from "react-native";
import { CircleCheck, CircleX } from "lucide-react-native";
import { PasswordRule } from "@lib/passwordValidation";

// Checklist de regras de senha AO VIVO (espelhado do front-client): cada regra
// mostra check verde quando cumprida e x vermelho quando nao. Use junto de
// getPasswordRules(password) no cadastro. Migrado p/ NativeWind (v2) — usado
// pelas telas de cadastro/recuperar senha, ja convertidas.
export function PasswordRules({ rules }: { rules: PasswordRule[] }) {
  return (
    <View className="mt-1 mb-3 gap-1">
      {rules.map((rule) => {
        const Icon = rule.passed ? CircleCheck : CircleX;
        return (
          <View key={rule.label} className="flex-row items-center gap-1">
            <Icon size={14} color={rule.passed ? "#163300" : "#B3261E"} />
            <Text
              className={`font-body text-xs ${rule.passed ? "text-vupth-forest" : "text-vupth-danger"}`}
            >
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
