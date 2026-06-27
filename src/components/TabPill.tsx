import type { ReactNode } from "react";
import { View } from "react-native";

// [new-design] Pilula da aba ativa: fundo verde-claro arredondado atras do
// icone quando focado (linguagem Verde Imersivo). Usado nos tabBarIcon.
export function TabPill({ focused, children }: { focused: boolean; children: ReactNode }) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: focused ? "rgba(0,179,126,0.12)" : "transparent",
      }}
    >
      {children}
    </View>
  );
}

// [new-design] Sombra superior sutil da tab bar (mesclar no tabBarStyle).
export const tabBarShadow = {
  shadowColor: "#1B4332",
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.06,
  shadowRadius: 14,
  elevation: 8,
};
