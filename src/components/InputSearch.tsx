import { View, Text, TextInput, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Campo de busca com lupa. Migrado p/ NativeWind (v2). API: textLabel + props
// de TextInput. (Sem uso ativo hoje, mantido por compatibilidade.)
type Props = TextInputProps & { textLabel: string };

export function InputSearch({ textLabel, ...rest }: Props) {
  return (
    <View className="mb-3 w-full">
      <Text className="font-body text-sm text-gray-600 mb-1">{textLabel}</Text>
      <View className="flex-row items-center bg-white rounded-md px-3 h-12 border border-brand">
        <Ionicons name="search" size={18} color="#065F46" />
        <TextInput
          className="flex-1 ml-2 font-body text-gray-900"
          placeholderTextColor="#9CA3AF"
          {...rest}
        />
      </View>
    </View>
  );
}
