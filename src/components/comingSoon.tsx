import { Alert, Pressable, View, Text } from "react-native";
import { ArrowLeft, Clock } from "lucide-react-native";

// Placeholder para funcionalidades cujo BACKEND ainda nao existe: a UI ja fica
// pronta e, no clique, avisamos "em breve". Ao ligar o endpoint, troca-se a
// chamada de `comingSoon(...)` pela API real — assim medimos quais features
// fizeram mais falta. (Estrategia Andre 2026-07-12.)
export function comingSoon(feature = "Essa funcionalidade") {
  Alert.alert("Em breve", `${feature} estará disponível em breve.`);
}

// Tela placeholder (nao o alerta acima) para rotas ja linkadas no menu cujo
// conteudo ainda nao foi construido (ex.: "Dados Pessoais"). Fica no mesmo
// arquivo do `comingSoon()` de proposito — dois arquivos que so diferem por
// maiuscula/minuscula (`ComingSoon.ts` vs `comingSoon.ts`) quebram build em
// filesystem case-insensitive (bug ja visto aqui).
export function ComingSoon({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        className="absolute top-[60px] left-5 bg-vupth-greenTint rounded-full p-2.5 active:opacity-70"
      >
        <ArrowLeft size={20} color="#163300" />
      </Pressable>
      <View className="items-center gap-3">
        <View className="w-[72px] h-[72px] rounded-full bg-vupth-greenTint items-center justify-center">
          <Clock size={32} color="#163300" />
        </View>
        <Text className="font-display text-xl text-vupth-forest text-center">{title}</Text>
        <Text className="font-body text-sm text-vupth-textSecondary text-center">
          Essa parte ainda está em construção.{"\n"}Em breve por aqui.
        </Text>
      </View>
    </View>
  );
}
