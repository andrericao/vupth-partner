import { View, Text, Pressable } from "react-native";
import { SERVICE_TYPES } from "@lib/serviceTypes";

// Seletor de tipo de loja (lista de "pilulas"). Migrado p/ NativeWind (v2);
// mantem a API (value/onValueChange). Lista em @lib/serviceTypes — mesma
// fonte usada por quem EXIBE o tipo (dashboard, menu, busca), pra rotulo e
// picker nunca desalinharem.
type Props = {
  value?: string;
  onValueChange?: (value: string) => void;
};

export function SelectService({ value, onValueChange }: Props) {
  return (
    <View className="mb-3 w-full">
      <Text className="font-body text-sm text-vupth-textSecondary">Tipo de Loja</Text>
      <View className="mt-1 gap-1">
        {SERVICE_TYPES.map((type) => {
          const isSelected = value === type.value;
          return (
            <Pressable
              key={type.value}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onValueChange?.(type.value)}
              className={`py-2.5 px-4 rounded-md border ${
                isSelected ? "bg-vupth-forest border-vupth-forest" : "bg-vupth-surface border-vupth-border"
              }`}
            >
              <Text
                className={`font-body text-center ${isSelected ? "text-white" : "text-vupth-textPrimary"}`}
              >
                {type.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
