import { House, Users, Grid3x3, Hourglass, ChartColumn, User } from "lucide-react-native";
import type { ComponentType } from "react";

/**
 * Icone da tab bar. Os glifos sao os que o Pencil nomeia nos componentes
 * `Tab Bar Owner v2` e `Tab Bar Professional` (campo icon+library de cada no),
 * lidos direto do arquivo — nao equivalentes escolhidos no olho.
 *
 * [marca-vupth] Era Ionicons com o truque `name` / `name-outline`: contorno
 * quando inativo, PREENCHIDO quando ativo. O lucide e monolinear e nao tem par
 * preenchido — e o Pencil tambem NAO usa esse recurso: la o estado ativo e
 * marcado por COR (`$forest` vs `$text-secondary`) mais a pilula `$green-tint`
 * atras do icone. E o que fazemos aqui.
 */
const ICONS = {
  home: House,
  queues: Users,
  menu: Grid3x3,
  queue: Users,
  fits: Hourglass,
  reports: ChartColumn,
  profile: User,
} satisfies Record<string, ComponentType<{ size?: number; color?: string }>>;

export type TabIconName = keyof typeof ICONS;

const ACTIVE = "#163300"; // [marca-vupth] $forest — nao aceita token, so hex
const INACTIVE = "#454745"; // $text-secondary (era #9CA3AF, cinza generico)

export function TabBarIcon({ name, focused }: { name: TabIconName; focused: boolean }) {
  const Icon = ICONS[name];
  return <Icon size={22} color={focused ? ACTIVE : INACTIVE} />;
}

// [new-design] Sombra superior sutil da tab bar. E uma das POUCAS sombras
// legitimas: a tab bar flutua sobre o conteudo (ver `floatingShadow`).
export const tabBarShadow = {
  shadowColor: "#163300",
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.06,
  shadowRadius: 14,
  elevation: 8,
};
