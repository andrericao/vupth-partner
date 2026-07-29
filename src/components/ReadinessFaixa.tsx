import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import type { Completion } from "@lib/completion";
import { hasBasicPending } from "@lib/completion";
import { useUiStore } from "@store/ui.store";

// Faixa de prontidao na Home (dono e profissional). Mesma FORMA da faixa
// "Em fila" do app do cliente, porem em tom AMBAR (aviso, nao urgencia).
// Regras (Andre 2026-07-11):
//  - so existe enquanto ha pendencia de "Pronto para atender" (hasBasicPending);
//  - aparece a cada abertura do app (o dismissal vive em memoria, ver ui.store);
//  - o X fecha naquela sessao; encaminha para as Configuracoes ao tocar.
// Pendencia so de perfil NAO gera faixa — so o dot (ver PendingDot).
// Migrado p/ NativeWind (v2).
type Props = {
  completion: Completion;
  /** Rota das Configuracoes (dono -> dados do estab.; profissional -> settings). */
  targetRoute: string;
  /** Complemento do texto: "aparecer aos clientes" | "atender clientes". */
  goalNoun: string;
};

export function ReadinessFaixa({ completion, targetRoute, goalNoun }: Props) {
  const dismissed = useUiStore((s) => s.faixaDismissed);
  const dismiss = useUiStore((s) => s.dismissFaixa);

  if (!hasBasicPending(completion) || dismissed) return null;

  const n = completion.basic.pending;
  const passos = n === 1 ? "1 passo" : `${n} passos`;

  return (
    <View className="flex-row items-center gap-2 bg-amber-100 border border-amber-200 rounded-xl px-3 py-3 mt-4">
      <Pressable
        className="flex-1"
        onPress={() => router.push(targetRoute as any)}
        accessibilityRole="button"
        accessibilityLabel="Completar cadastro"
      >
        <View className="flex-row items-center gap-2">
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: "#FFB703",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text className="text-white font-bold text-sm">{n}</Text>
          </View>
          <View className="flex-1">
            <Text className="font-heading text-sm text-amber-800">
              Complete seu cadastro
            </Text>
            <Text className="font-body text-xs text-amber-700">
              {passos} para {goalNoun}
            </Text>
          </View>
          <Text className="text-amber-700 text-lg font-bold">›</Text>
        </View>
      </Pressable>

      <Pressable
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel="Fechar aviso"
        hitSlop={8}
        className="w-6 h-6 items-center justify-center rounded-full active:bg-amber-200"
      >
        <Text className="text-amber-700 text-base">✕</Text>
      </Pressable>
    </View>
  );
}
