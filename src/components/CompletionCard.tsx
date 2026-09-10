import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { ChevronRight, Check } from "lucide-react-native";
import type { Completion, CompletionTracker } from "@lib/completion";

type Props = {
  completion: Completion;
  /** Texto do banner verde quando o basico chega a 100%. */
  /** Rota para completar cada item (por key). undefined = item nao navegavel. */
  routeFor: (key: string) => string | undefined;
};

function Bar({ percent, muted }: { percent: number; muted?: boolean }) {
  return (
    <View
      style={{
        height: 9,
        borderRadius: 99,
        // [marca-vupth] Trilho vazio da barra: $brandBorder e o UNICO neutro da
        // paleta mais escuro que o $brandSurface do card — no surface a barra
        // sumiria. Era #E8EDEA, cinza da paleta pre-marca.
        backgroundColor: "#D7DDD3",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${percent}%`,
          borderRadius: 99,
          backgroundColor: muted ? "#E2F6D5" : "#9FE870", // [marca-vupth] greenTint / brandGreen
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
          backgroundColor: done ? "#163300" : "#FFFFFF", // [marca-vupth] $forest
          borderWidth: done ? 0 : 2,
          borderColor: "#D7DDD3", // [marca-vupth] $brandBorder
        }}
      >
        {/* [marca-vupth] Sobre `forest` o par e brand-green, nunca branco. */}
        {done && <Check size={13} color="#9FE870" strokeWidth={3} />}
      </View>
      <Text
        className={`flex-1 font-body text-sm ${
          done ? "text-vupth-textSecondary" : "font-bold text-vupth-textPrimary"
        }`}
      >
        {label}
      </Text>
      {navigable && <ChevronRight size={16} color="#454745" />}
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
  return (
    <View className="mt-2">
      {tracker.items.map((item, idx) => (
        <View key={item.key}>
          {idx > 0 && <View style={{ height: 1, backgroundColor: "#D7DDD3" }} />}
          <Row label={item.label} done={item.done} route={routeFor(item.key)} />
        </View>
      ))}
    </View>
  );
}

export function CompletionCard({ completion, routeFor }: Props) {
  const { basic, profile } = completion;

  // Nada a mostrar quando tudo esta completo.
  if (basic.percent === 100 && profile.percent === 100) return null;

  const n = basic.pending;
  const hint =
    n === 1 ? "Falta 1 passo para aparecer aos clientes." : `Faltam ${n} passos para aparecer aos clientes.`;

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
            <Text className="font-heading text-base text-vupth-textPrimary">
              Pronto para atender
            </Text>
            <Text className="font-heading text-base text-vupth-forest">
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
          <View style={{ height: 1, backgroundColor: "#D7DDD3", marginVertical: 14 }} />
          <View className="flex-row justify-between items-baseline mb-2">
            <Text className="font-heading text-sm text-vupth-textPrimary">
              Perfil completo
            </Text>
            {/* [marca-vupth] Era text-brand-600 — escala ANTIGA (#3b7a3f,
                pre-marca), único resquício dela neste card (a linha "Pronto
                para atender" acima já usava vupth-forest). */}
            <Text className="font-heading text-sm text-vupth-forest">
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
