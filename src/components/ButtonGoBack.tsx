import { Pressable, type PressableProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Botao "voltar" (chevron) — circulo verde. Migrado p/ NativeWind (v2);
// mantem a API (onPress) usada pelo Header. RN puro + className.
export function ButtonGoBack(props: PressableProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      className="w-[39px] h-[39px] rounded-[18px] bg-vupth-forest items-center justify-center active:bg-vupth-forestSoft"
      {...props}
    >
      <Ionicons name="chevron-back" size={22} color="#fff" />
    </Pressable>
  );
}
