import { View, Text } from "react-native";
import { useFs } from "@store/fonte.store";
import { badgeLabel } from "@lib/notifications";
import { useTema } from "@hooks/useTema";

// Badge vermelho com CONTAGEM (1..9, depois "9+"). Substitui o dot mudo do
// botao de Opcoes da fila e o badge cru das linhas do menu. Em RN puro de
// proposito: e usado por telas v1 (gluestack) e v2 (NativeWind) enquanto a
// migracao durar.
type Props = {
  count: number;
  testID?: string;
};

export function NotificationBadge({ count, testID = "notification-badge" }: Props) {
  const fs = useFs();
  const { cores } = useTema();
  const label = badgeLabel(count);
  if (!label) return null;

  const shown = Math.floor(count);
  return (
    <View
      testID={testID}
      accessibilityLabel={`${shown} ${shown === 1 ? "notificação" : "notificações"}`}
      style={{
        minWidth: fs(18),
        height: fs(18),
        paddingHorizontal: 5,
        borderRadius: fs(18) / 2,
        backgroundColor: cores.danger,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: cores.onDanger,
          fontSize: fs(11),
          lineHeight: fs(14),
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
