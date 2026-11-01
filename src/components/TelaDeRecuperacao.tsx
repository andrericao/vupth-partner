import { Pressable, Text, View } from "react-native";
import { useTema } from "@hooks/useTema";

/**
 * log-de-falha-na-abertura: a tela que aparece quando uma tela quebra, em vez de o
 * app fechar. Nao mostra o erro (pode ter dado de pessoa); o motivo vai ao Sentry.
 */
export function TelaDeRecuperacao({ onTentarDeNovo }: { onTentarDeNovo: () => void }) {
  const { cores } = useTema();
  return (
    <View
      testID="tela-de-recuperacao"
      style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: cores.background }}
    >
      <Text style={{ color: cores.textPrimary, fontSize: 20, fontWeight: "700", marginBottom: 8 }}>
        Algo deu errado
      </Text>
      <Text style={{ color: cores.textSecondary, fontSize: 15, textAlign: "center", marginBottom: 24 }}>
        Não foi possível abrir esta tela. Tente de novo.
      </Text>
      <Pressable
        testID="tentar-de-novo"
        accessibilityRole="button"
        onPress={onTentarDeNovo}
        style={{ backgroundColor: cores.green, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 999 }}
      >
        <Text style={{ color: cores.onGreen, fontSize: 16, fontWeight: "700" }}>Tentar de novo</Text>
      </Pressable>
    </View>
  );
}
