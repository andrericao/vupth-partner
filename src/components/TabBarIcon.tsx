import { Ionicons } from "@expo/vector-icons";

// [new-design] Icone da tab bar: contorno (outline) quando inativo e
// PREENCHIDO + verde quando ativo. O preenchimento e o indicador da aba atual
// (sem pilula). `name` = nome base do Ionicons (ex.: "home").
const ACTIVE = "#163300"; // [marca-vupth] $forest — icone/label ativo nao aceita token, so hex
const INACTIVE = "#9CA3AF";

export function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconName = (focused ? name : `${name}-outline`) as any;
  return <Ionicons name={iconName} size={24} color={focused ? ACTIVE : INACTIVE} />;
}

// [new-design] Sombra superior sutil da tab bar (mesclar no tabBarStyle).
export const tabBarShadow = {
  shadowColor: "#1A281A",
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.06,
  shadowRadius: 14,
  elevation: 8,
};
