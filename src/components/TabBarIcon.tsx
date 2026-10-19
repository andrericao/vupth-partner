import { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { House, Users, List, Hourglass, ChartColumn, User } from "lucide-react-native";
import type { ComponentType } from "react";
import { EASE, movimentoReduzido } from "@lib/motion";
import { useTema } from "@hooks/useTema";

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
  // [marca-vupth] DS5.2: era `Grid3x3`, lido do arquivo de design. Grade de
  // quadrados e a convencao de "todos os apps / launcher" — promete uma grade
  // de atalhos e entrega uma LISTA agrupada (EQUIPE, NEGOCIO, CONTA). O `list`
  // diz o que tem dentro.
  //
  // Nao virou reticencia, que seria o "Mais" do iOS: `Ellipsis` ja e o botao
  // "Opcoes da fila" na tela do profissional, e o mesmo glifo nao pode
  // significar uma ABA e um BOTAO de opcoes no mesmo app.
  //
  // ⚠️ Acima de ~185% de fonte a tab bar larga os rotulos (DS4) e sobra so o
  // icone. A palavra "Menu" nao vai estar la pra desambiguar — o glifo tem de
  // se virar sozinho.
  menu: List,
  queue: Users,
  fits: Hourglass,
  reports: ChartColumn,
  profile: User,
} satisfies Record<string, ComponentType<{ size?: number; color?: string }>>;

export type TabIconName = keyof typeof ICONS;

export function TabBarIcon({ name, focused }: { name: TabIconName; focused: boolean }) {
  const { cores } = useTema();
  const Icon = ICONS[name];
  const pilula = usePilula(focused);
  // A pilula ocupa espaco SEMPRE (o inativo so nao a pinta), senao a linha de
  // icones pula de altura a cada troca de aba. Ela e uma camada atras do icone
  // que entra em fade e escala: a aba que acende e a que apaga trocam em 0,25 s,
  // em vez de o fundo trocar de uma vez.
  return (
    <View className="px-4 py-1 rounded-full">
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, pilula]}>
        <View className="flex-1 bg-vupth-greenTint rounded-full" />
      </Animated.View>
      {/* O icone ativo repousa sobre a pilula greenTint: o par dele e `onGreenTint`
          (forest no claro, green no escuro). O inativo repousa na barra
          (`background`) e e o `textSecondary`, como o rotulo. */}
      <Icon size={22} color={focused ? cores.onGreenTint : cores.textSecondary} />
    </View>
  );
}

function usePilula(focused: boolean) {
  const [v] = useState(() => new Animated.Value(focused ? 1 : 0));
  useEffect(() => {
    let vivo = true;
    let anim: Animated.CompositeAnimation | null = null;
    movimentoReduzido().then((reduzido) => {
      if (!vivo) return;
      if (reduzido) {
        v.setValue(focused ? 1 : 0);
        return;
      }
      anim = Animated.timing(v, { toValue: focused ? 1 : 0, duration: 250, easing: EASE.entrada, useNativeDriver: true });
      anim.start();
    });
    return () => {
      vivo = false;
      anim?.stop();
    };
  }, [focused, v]);
  return { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] };
}

// [new-design] Sombra superior sutil da tab bar. E uma das POUCAS sombras
// legitimas: a tab bar flutua sobre o conteudo (ver `floatingShadow`).
export const tabBarShadow = {
  // tema-fixo: sombra forest a 6%, o mesmo hex nos dois temas (como em lib/styles.ts); no escuro ela quase nao aparece sobre o fundo
  shadowColor: "#163300",
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.06,
  shadowRadius: 14,
  elevation: 8,
};
