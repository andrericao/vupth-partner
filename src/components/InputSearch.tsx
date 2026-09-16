import { View, Text, TextInput, type TextInputProps } from "react-native";
import { Search } from "lucide-react-native";

// Campo de busca com lupa. Migrado p/ NativeWind (v2). API: textLabel + props
// de TextInput. (Sem uso ativo hoje, mantido por compatibilidade.)
type Props = TextInputProps & { textLabel: string };

export function InputSearch({ textLabel, ...rest }: Props) {
  return (
    <View className="mb-3 w-full">
      <Text className="font-body text-sm text-vupth-textSecondary mb-1">{textLabel}</Text>
      {/* [marca-vupth] Borda neutra no lugar do border-success-500 (escala v1):
          o campo so fica verde (vupth-forest) em foco, e este componente nao
          rastreia foco. */}
      <View className="flex-row items-center bg-white rounded-md px-3 h-12 border border-vupth-border">
        <Search size={18} color="#163300" />
        <TextInput
          className="flex-1 ml-2 font-body text-vupth-textPrimary"
          placeholderTextColor="#6B706B"
          {...rest}
        />
      </View>
    </View>
  );
}
