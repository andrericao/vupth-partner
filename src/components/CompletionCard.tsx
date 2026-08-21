import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import type { Completion, CompletionTracker } from "@lib/completion";

type Props = {
  completion: Completion;
  /** Texto do banner verde quando o basico chega a 100%. */
  doneBanner: string;
  /** Rota para completar cada item (por key). undefined = item nao navegavel. */
  routeFor: (key: string) => string | undefined;
};

function Bar({ percent, muted }: { percent: number; muted?: boolean }) {
  return (
    <View
      style={{
        height: 9,
        borderRadius: 99,
        backgroundColor: "#E8EDEA",
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
          borderColor: "#E0E7E3",
        }}
      >
        {done && <Text className="text-white text-xs font-bold">✓</Text>}
      </View>
      <Text
        className={`flex-1 font-body text-sm ${
          done ? "text-gray-400" : "font-bold text-gray-800"
        }`}
      >
        {label}
      </Text>
      {navigable && <ChevronRight size={16} color="#D1D5DB" />}
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
          {idx > 0 && <View style={{ height: 1, backgroundColor: "#EEF2F0" }} />}
          <Row label={item.label} done={item.done} route={routeFor(item.key)} />
        </View>
      ))}
    </View>
  );
}

export function CompletionCard({ completion, doneBanner, routeFor }: Props) {
  const { basic, profile } = completion;

  // Nada a mostrar quando tudo esta completo.
  if (basic.percent === 100 && profile.percent === 100) return null;

  const n = basic.pending;
  const hint =
    n === 1 ? "Falta 1 passo para aparecer aos clientes." : `Faltam ${n} passos para aparecer aos clientes.`;

  return (
    <View className="bg-vupth-surface rounded-[20px] p-4 mt-4">
      {basic.percent === 100 ? (
        <View className="flex-row items-center gap-3 bg-vupth-forest rounded-xl px-4 py-3.5">
          <Text className="text-xl">🎉</Text>
          <View className="flex-1">
            <Text className="font-heading text-sm text-white">{doneBanner}</Text>
            <Text className="font-body text-xs text-vupth-greenTint">
              Pronto para atender — 100%
            </Text>
          </View>
        </View>
      ) : (
        <View>
          <View className="flex-row justify-between items-baseline mb-2">
            <Text className="font-heading text-base text-gray-800">
              Pronto para atender
            </Text>
            <Text className="font-heading text-base text-vupth-forest">
              {basic.percent}%
            </Text>
          </View>
          <Bar percent={basic.percent} />
          <Text className="font-body text-xs text-gray-500 mt-2">{hint}</Text>
          <List tracker={basic} routeFor={routeFor} />
        </View>
      )}

      {profile.total > 0 && (
        <>
          <View style={{ height: 1, backgroundColor: "#EEF2F0", marginVertical: 14 }} />
          <View className="flex-row justify-between items-baseline mb-2">
            <Text className="font-heading text-sm text-gray-700">
              Perfil completo
            </Text>
            {/* [marca-vupth] Era text-brand-600 — escala ANTIGA (#3b7a3f,
                pre-marca), unico resquicio dela neste card (a linha "Pronto
                para atender" acima ja usava vupth-forest). */}
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
