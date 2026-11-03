import { Text, View } from "react-native";
import * as Updates from "expo-updates";
import { commitVisivelNoCanal } from "@lib/commitDoCodigo";
import { useTema } from "@hooks/useTema";

/**
 * faixa-de-ambiente (fraquezas F20): nos builds de teste (qualquer canal que nao seja
 * `production`) uma faixa fina avisa que e ambiente de teste, para ninguem confundir com
 * a producao. Na producao nao aparece. Cores do tema, nada de hex.
 */
export function FaixaDeAmbiente() {
  const { cores } = useTema();
  if (!commitVisivelNoCanal(Updates.channel)) return null;
  return (
    <View
      testID="faixa-de-ambiente"
      accessibilityLabel="Ambiente de teste"
      style={{ paddingVertical: 2, backgroundColor: cores.surface }}
    >
      <Text style={{ color: cores.textSecondary, fontSize: 10, textAlign: "center" }}>
        AMBIENTE DE TESTE
      </Text>
    </View>
  );
}
