import { View, Text, Pressable } from "react-native";
import { PASSOS_DA_FONTE, rotuloDoPasso } from "@lib/fonte";
import { useFonteStore } from "@store/fonte.store";

// "Tamanho da letra" (Andre, 26/09): a mesma escolha do Client — Normal, +1…+4.
// Vale na hora, no app inteiro, e fica no aparelho.
export function TamanhoDaLetra() {
  const passo = useFonteStore((s) => s.passo);
  const escolher = useFonteStore((s) => s.escolher);
  return (
    <View className="gap-2">
      <Text className="font-body text-f11 font-bold tracking-wider text-vupth-textSecondary">TAMANHO DA LETRA</Text>
      <View className="flex-row gap-2 bg-vupth-surface rounded-card p-3">
        {PASSOS_DA_FONTE.map((p) => {
          const ativo = passo === p;
          return (
            <Pressable
              key={p}
              onPress={() => escolher(p)}
              accessibilityRole="button"
              accessibilityState={{ selected: ativo }}
              accessibilityLabel={`Tamanho da letra ${rotuloDoPasso(p)}`}
              testID={`fonte-${p}`}
              className={`flex-1 py-2 rounded-full items-center active:opacity-70 ${ativo ? "bg-vupth-forest" : "bg-white"}`}
            >
              <Text className={`font-heading text-f13 ${ativo ? "text-vupth-green" : "text-vupth-forest"}`}>
                {rotuloDoPasso(p)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
