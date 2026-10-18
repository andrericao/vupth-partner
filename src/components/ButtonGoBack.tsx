import { Pressable, type PressableProps } from "react-native";
import { ChevronLeft } from "lucide-react-native";

// Botao "voltar" (chevron) — circulo verde. Migrado p/ NativeWind (v2);
// mantem a API (onPress) usada pelo Header. RN puro + className.
export function ButtonGoBack(props: PressableProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      className="w-[39px] h-[39px] rounded-full bg-vupth-forest items-center justify-center active:bg-vupth-forestSoft"
      {...props}
    >
      {/* tema-fixo: o botao e forest nos dois temas (mesmo hex) e o branco sobre ele passa nos dois */}
      <ChevronLeft size={22} color="#fff" />
    </Pressable>
  );
}
