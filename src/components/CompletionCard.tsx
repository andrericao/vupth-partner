import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { ChevronRight, Check } from "lucide-react-native";
import type { Completion, CompletionTracker } from "@lib/completion";
import { PendingDot } from "@components/PendingDot";
import { useTema } from "@hooks/useTema";

type Props = {
  completion: Completion;
  /** Texto do banner verde quando o basico chega a 100%. */
  /** Rota para completar cada item (por key). undefined = item nao navegavel. */
  routeFor: (key: string) => string | undefined;
};

function Bar({ percent, muted }: { percent: number; muted?: boolean }) {
  const { cores } = useTema();
  return (
    <View
      style={{
        height: 9,
        borderRadius: 99,
        // Trilho vazio da barra, sobre o surface do card: no claro o `border` e o
        // UNICO neutro mais escuro que ele (no surface a barra sumiria; era
        // #E8EDEA, cinza da paleta pre-marca). No escuro o `border` e um verde
        // vivo, entao o papel `trilho` (surfaceAlt) assume.
        backgroundColor: cores.trilho,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${percent}%`,
          borderRadius: 99,
          backgroundColor: muted ? cores.progressoSuave : cores.green, // greenTint no claro (o suave) / brandGreen
        }}
      />
    </View>
  );
}

function Row({
  label,
  done,
  route,
}: {
  label: string;
  done: boolean;
  route?: string;
}) {
  const { cores } = useTema();
  const navigable = !done && !!route;
  const content = (
    <View className="flex-row items-center gap-3 py-2.5 px-2">
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: done ? cores.selecionado : cores.background, // forest (no escuro, green) / fundo
          borderWidth: done ? 0 : 2,
          borderColor: cores.border,
        }}
      >
        {/* [marca-vupth] Sobre `forest` o par e brand-green, nunca branco (o papel
            onSelecionado: no escuro o fundo e o green e o par e o onGreen). */}
        {done && <Check size={13} color={cores.onSelecionado} strokeWidth={3} />}
      </View>
      <Text
        className={`flex-1 font-body text-sm ${
          done ? "text-vupth-textSecondary" : "font-bold text-vupth-textPrimary"
        }`}
      >
        {label}
      </Text>
      {navigable && <ChevronRight size={16} color={cores.textSecondary} />}
    </View>
  );

  if (navigable) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(route as any)}
        className="active:opacity-60"
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

function List({
  tracker,
  routeFor,
}: {
  tracker: CompletionTracker;
  routeFor: (key: string) => string | undefined;
}) {
  const { cores } = useTema();
  return (
    <View className="mt-2">
      {tracker.items.map((item, idx) => (
        <View key={item.key}>
          {idx > 0 && <View style={{ height: 1, backgroundColor: cores.border }} />}
          <Row label={item.label} done={item.done} route={routeFor(item.key)} />
        </View>
      ))}
    </View>
  );
}

export function CompletionCard({ completion, routeFor }: Props) {
  const { cores } = useTema();
  const { basic, profile } = completion;

  // Nada a mostrar quando tudo esta completo.
  if (basic.percent === 100 && profile.percent === 100) return null;

  const n = basic.pending;
  // "Toque no que falta" nao e enfeite: e a instrucao que faltava. O card
  // parecia um RESUMO — e resumo ninguem toca.
  const hint =
    n === 1
      ? "Falta 1 passo para aparecer aos clientes. Toque nele para resolver."
      : `Faltam ${n} passos para aparecer aos clientes. Toque no que falta para resolver.`;

  return (
    <View className="bg-vupth-surface rounded-card p-4 mt-4">
      {/* 🔴 A faixa verde de "cadastro completo" SAIU em 10/09: ela ficava na
          tela enquanto o "Perfil completo" nao fechasse — ou seja, quase
          sempre. Noticia que nao sai de cena vira decoracao, e a pessoa para de
          ler o card inteiro. O anuncio virou MODAL, uma vez, no momento em que
          o fato acontece (ver src/lib/anuncioPronto.ts). */}
      {basic.percent === 100 ? null : (
        <View>
          <View className="flex-row justify-between items-baseline mb-2">
            {/* 🔴 O dot entra AQUI porque "alguns usuários não entenderam que
                o card é clicável" (Andre, 11/09). As linhas sempre navegaram —
                o que faltava era dizer que havia algo a fazer nelas. Mesmo dot
                das Configurações: quem já aprendeu o que ele significa num
                lugar não precisa reaprender no outro. */}
            <View className="flex-row items-center gap-2">
              <Text className="font-heading text-base text-vupth-textPrimary">
                Pronto para atender
              </Text>
              <PendingDot />
            </View>
            <Text className="font-heading text-base text-vupth-textPrimary">
              {basic.percent}%
            </Text>
          </View>
          <Bar percent={basic.percent} />
          <Text className="font-body text-xs text-vupth-textSecondary mt-2">{hint}</Text>
          <List tracker={basic} routeFor={routeFor} />
        </View>
      )}

      {profile.total > 0 && (
        <>
          <View style={{ height: 1, backgroundColor: cores.border, marginVertical: 14 }} />
          <View className="flex-row justify-between items-baseline mb-2">
            <View className="flex-row items-center gap-2">
              <Text className="font-heading text-sm text-vupth-textPrimary">
                Perfil completo
              </Text>
              {profile.pending > 0 && <PendingDot />}
            </View>
            {/* [marca-vupth] Era text-brand-600 — escala ANTIGA (#3b7a3f,
                pre-marca), único resquício dela neste card (a linha "Pronto
                para atender" acima já usava vupth-forest). */}
            <Text className="font-heading text-sm text-vupth-textPrimary">
              {profile.percent}%
            </Text>
          </View>
          <Bar percent={profile.percent} muted />
          <List tracker={profile} routeFor={routeFor} />
        </>
      )}
    </View>
  );
}
