import { View, Text } from "react-native";
import { CircleCheck, CircleX } from "lucide-react-native";
import { PasswordRule } from "@lib/passwordValidation";
import { useTema } from "@hooks/useTema";

// Checklist de regras de senha AO VIVO (espelhado do front-client): cada regra
// mostra check verde quando cumprida e x vermelho quando nao. Use junto de
// getPasswordRules(password) no cadastro. Migrado p/ NativeWind (v2) — usado
// pelas telas de cadastro/recuperar senha, ja convertidas.
export function PasswordRules({ rules }: { rules: PasswordRule[] }) {
  const { cores } = useTema();
  return (
    <View className="mt-1 mb-3 gap-1">
      {rules.map((rule) => {
        const Icon = rule.passed ? CircleCheck : CircleX;
        return (
          <View key={rule.label} className="flex-row items-center gap-1">
            <Icon size={14} color={rule.passed ? cores.textPrimary : cores.danger} />
            <Text
              className={`font-body text-xs ${rule.passed ? "text-vupth-textPrimary" : "text-vupth-danger"}`}
            >
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
