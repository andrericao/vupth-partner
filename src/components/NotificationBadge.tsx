import { View, Text } from "react-native";
import { badgeLabel } from "@lib/notifications";

// Badge vermelho com CONTAGEM (1..9, depois "9+"). Substitui o dot mudo do
// botao de Opcoes da fila e o badge cru das linhas do menu. Em RN puro de
// proposito: e usado por telas v1 (gluestack) e v2 (NativeWind) enquanto a
// migracao durar.
type Props = {
  count: number;
  testID?: string;
};

export function NotificationBadge({ count, testID = "notification-badge" }: Props) {
  const label = badgeLabel(count);
  if (!label) return null;

  const shown = Math.floor(count);
  return (
    <View
      testID={testID}
      accessibilityLabel={`${shown} ${shown === 1 ? "notificacao" : "notificacoes"}`}
      style={{
        minWidth: 18,
        height: 18,
        paddingHorizontal: 5,
        borderRadius: 9,
        backgroundColor: "#E63946",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 11,
          lineHeight: 14,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
