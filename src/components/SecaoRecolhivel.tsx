import { useState, type ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useTema } from "@hooks/useTema";

// relatorios-com-dropdown (Andre, 22/10): "A conta do periodo" e "Nao realizados"
// ficam recolhidos por padrao; o toque no titulo abre e fecha.
export function SecaoRecolhivel({
  titulo,
  testID,
  children,
  inicialmenteAberta = false,
}: {
  titulo: string;
  testID?: string;
  children: ReactNode;
  inicialmenteAberta?: boolean;
}) {
  const tema = useTema();
  const [aberta, setAberta] = useState(inicialmenteAberta);
  const Seta = aberta ? ChevronUp : ChevronDown;

  return (
    <View testID={testID} className="bg-vupth-surface p-4 rounded-card">
      <Pressable
        testID={testID ? `${testID}-titulo` : undefined}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberta }}
        onPress={() => setAberta((v) => !v)}
        className="flex-row items-center justify-between"
      >
        <Text className="font-heading text-sm text-vupth-textPrimary">{titulo}</Text>
        <Seta size={18} color={tema.cores.textSecondary} />
      </Pressable>
      {aberta && <View className="mt-2">{children}</View>}
    </View>
  );
}
