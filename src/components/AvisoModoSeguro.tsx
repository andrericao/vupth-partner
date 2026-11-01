import { Text, View } from "react-native";
import { useModoSeguro } from "@lib/aberturas";
import { useTema } from "@hooks/useTema";

/**
 * log-de-falha-na-abertura: o app subiu em modo seguro (caiu 2 vezes seguidas na
 * abertura). So desliga o opcional; login e dados seguem. Aviso curto, sem culpa.
 */
export function AvisoModoSeguro() {
  const seguro = useModoSeguro((s) => s.seguro);
  const { cores } = useTema();
  if (!seguro) return null;
  return (
    <View
      testID="aviso-modo-seguro"
      accessibilityRole="alert"
      style={{ padding: 12, backgroundColor: cores.surface }}
    >
      <Text style={{ color: cores.textPrimary, fontSize: 14 }}>
        Abrimos em modo seguro porque o app fechou ao abrir. Algumas funções opcionais ficam desligadas por ora.
      </Text>
    </View>
  );
}
