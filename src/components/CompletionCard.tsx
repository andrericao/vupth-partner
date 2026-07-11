import { VStack, HStack, Text, Pressable } from "@gluestack-ui/themed";
import { View } from "react-native";
import { router } from "expo-router";
import { cardShadow } from "@lib/styles";
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
          backgroundColor: muted ? "#8bbd8d" : "#3b7a3f",
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
    <HStack alignItems="center" space="md" py="$2.5" px="$2">
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: done ? "#3b7a3f" : "#FFFFFF",
          borderWidth: done ? 0 : 2,
          borderColor: "#E0E7E3",
        }}
      >
        {done && <Text color="$white" fontSize="$xs" fontWeight="$bold">✓</Text>}
      </View>
      <Text
        flex={1}
        fontFamily="$body"
        fontSize="$sm"
        fontWeight={done ? "$normal" : "$bold"}
        color={done ? "$coolGray400" : "$coolGray800"}
      >
        {label}
      </Text>
      {navigable && <Text color="$coolGray300" fontSize="$lg">›</Text>}
    </HStack>
  );

  if (navigable) {
    return (
      <Pressable onPress={() => router.push(route as any)} $active-opacity={0.6}>
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
    <VStack mt="$2">
      {tracker.items.map((item, idx) => (
        <View key={item.key}>
          {idx > 0 && <View style={{ height: 1, backgroundColor: "#EEF2F0" }} />}
          <Row label={item.label} done={item.done} route={routeFor(item.key)} />
        </View>
      ))}
    </VStack>
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
    <VStack bg="$white" borderRadius="$2xl" p="$4" style={cardShadow} mt="$4">
      {basic.percent === 100 ? (
        <HStack
          bg="$green600"
          borderRadius="$xl"
          px="$4"
          py="$3.5"
          alignItems="center"
          space="md"
        >
          <Text fontSize="$xl">🎉</Text>
          <VStack flex={1}>
            <Text fontFamily="$heading" fontWeight="$bold" color="$white" fontSize="$sm">
              {doneBanner}
            </Text>
            <Text fontFamily="$body" color="$green50" fontSize="$xs">
              Pronto para atender — 100%
            </Text>
          </VStack>
        </HStack>
      ) : (
        <VStack>
          <HStack justifyContent="space-between" alignItems="baseline" mb="$2">
            <Text fontFamily="$heading" fontWeight="$bold" fontSize="$md" color="$coolGray800">
              Pronto para atender
            </Text>
            <Text fontFamily="$heading" fontWeight="$bold" fontSize="$md" color="$green600">
              {basic.percent}%
            </Text>
          </HStack>
          <Bar percent={basic.percent} />
          <Text fontFamily="$body" fontSize="$xs" color="$coolGray500" mt="$2">
            {hint}
          </Text>
          <List tracker={basic} routeFor={routeFor} />
        </VStack>
      )}

      {profile.total > 0 && (
        <>
          <View style={{ height: 1, backgroundColor: "#EEF2F0", marginVertical: 14 }} />
          <HStack justifyContent="space-between" alignItems="baseline" mb="$2">
            <Text fontFamily="$heading" fontWeight="$bold" fontSize="$sm" color="$coolGray700">
              Perfil completo
            </Text>
            <Text fontFamily="$heading" fontWeight="$bold" fontSize="$sm" color="$green600">
              {profile.percent}%
            </Text>
          </HStack>
          <Bar percent={profile.percent} muted />
          <List tracker={profile} routeFor={routeFor} />
        </>
      )}
    </VStack>
  );
}
