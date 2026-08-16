import { View, Text, Pressable } from "react-native";

// Seletor de tipo de loja (lista de "pilulas"). Migrado p/ NativeWind (v2);
// mantem a API (value/onValueChange).
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
    <View className="mb-3 w-full">
      <Text className="font-body text-sm text-gray-600">Tipo de Loja</Text>
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
                isSelected ? "bg-vupth-forest border-vupth-forest" : "bg-gray-100 border-gray-200"
              }`}
            >
              <Text
                className={`font-body text-center ${isSelected ? "text-white" : "text-gray-700"}`}
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
