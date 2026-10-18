import { Pressable, Text, ActivityIndicator, View, type PressableProps } from "react-native";
import { ArrowRight } from "lucide-react-native";

// Botao de "proximo passo" (texto + seta). Migrado p/ NativeWind (v2). API:
// title/isLoading/onPress. (Sem uso ativo hoje, mantido por compatibilidade.)
type Props = Omit<PressableProps, "children"> & {
  title?: string;
  isLoading?: boolean;
};

export function StepsButton({ title, isLoading, disabled, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isLoading || disabled}
      className="h-12 mt-9 rounded-md bg-vupth-forest active:bg-vupth-forestSoft flex-row items-center justify-center px-4"
      {...rest}
    >
      {isLoading ? (
        // tema-fixo: o botao e forest nos dois temas (mesmo hex), e branco sobre forest passa nos dois
        <ActivityIndicator color="#fff" />
      ) : (
        <View className="flex-row items-center">
          {/* tema-fixo: branco sobre o forest do botao, igual nos dois temas */}
          <Text className="font-body text-white mr-3">{title}</Text>
          {/* tema-fixo: idem */}
          <ArrowRight size={18} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}
