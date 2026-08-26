import { View } from "react-native";
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
 * atras do icone.
 *
 * ⚠️ A PILULA FALTAVA. O codigo anterior fazia so a COR — e cor sozinha nao da
 * conta aqui: ativo `#163300` contra inativo `#454745` da **1,49:1 um contra o
 * outro**. Os dois se leem bem sobre o branco (13,9:1 e 9,4:1), mas entre si
 * sao dois tons escuros indistinguiveis: quem olha o rodape nao ve qual aba
 * esta aberta. E a mesma armadilha de trocar um verde escuro por outro e achar
 * que a marca chegou.
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
  // A pilula ocupa espaco SEMPRE (o inativo so nao pinta o fundo), senao a
  // linha de icones pula de altura a cada troca de aba.
  return (
    <View
      className={`px-4 py-1 rounded-full ${focused ? "bg-vupth-greenTint" : "bg-transparent"}`}
    >
      <Icon size={22} color={focused ? ACTIVE : INACTIVE} />
    </View>
  );
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
