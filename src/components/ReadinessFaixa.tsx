import { useEffect, useState } from "react";
import { Animated, View, Text, Pressable } from "react-native";
import { X } from "lucide-react-native";
import { router } from "expo-router";
import type { Completion } from "@lib/completion";
import { hasBasicPending } from "@lib/completion";
import { useUiStore } from "@store/ui.store";
import { EASE, MS, movimentoReduzido, useEntrada } from "@lib/motion";

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
  const n = completion.basic.pending;
  const total = completion.basic.total;
  const feitos = Math.max(0, total - n);
  const pct = total > 0 ? (feitos / total) * 100 : 0;
  const entrada = useEntrada({ dy: 12 });
  const progresso = useProgressoQueAnda(pct);

  if (!hasBasicPending(completion) || dismissed) return null;

  const passos = n === 1 ? "1 passo" : `${n} passos`;

  return (
    // [marca-vupth] Vinha em AMBAR — cor de alerta pra uma tarefa que nao e
    // erro nem urgencia: e so cadastro pendente. Passou pro greenTint com a
    // barra de progresso do Pencil (OWNER · 02 Menu), que MOSTRA o quanto ja
    // andou em vez de so cobrar o que falta.
    // `style` no Animated e `className` no View de dentro: o repositório só usa
    // `style` em componentes Animated, e a interop do NativeWind nao esta
    // garantida neles (o jest nao pega, porque so repassa a prop).
    <Animated.View style={entrada}>
    <View className="bg-vupth-greenTint rounded-card p-4 mt-4 gap-2.5">
      <Pressable
        onPress={() => router.push(targetRoute as any)}
        accessibilityRole="button"
        accessibilityLabel="Completar cadastro"
      >
        <View className="flex-row items-center justify-between">
          <Text className="font-display text-sm text-vupth-forest">
            {n === 1 ? "Falta 1 passo para abrir" : `Faltam ${n} passos para abrir`}
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="font-mono text-xs text-vupth-forest">
              {feitos} de {total}
            </Text>
            <Pressable
              onPress={dismiss}
              accessibilityRole="button"
              accessibilityLabel="Fechar aviso"
              hitSlop={8}
            >
              <X size={16} color="#163300" />
            </Pressable>
          </View>
        </View>

        {/* A barra e o ponto: progresso feito ao lado do que falta. */}
        <View className="h-1.5 rounded-full bg-vupth-forest/15 mt-2.5 overflow-hidden">
          <Animated.View style={{ height: "100%", width: progresso.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) }}>
            <View className="h-full w-full rounded-full bg-vupth-forest" />
          </Animated.View>
        </View>

        <Text className="font-body text-f11 font-semibold text-vupth-forest mt-2.5">
          {passos} para {goalNoun}.
        </Text>
      </Pressable>
    </View>
    </Animated.View>
  );
}

// A barra anda até o novo valor quando um passo é concluído: causa e efeito
// ("completei o cadastro, a barra avançou"). A largura não roda no driver nativo,
// mas é uma View de 6 px de altura. Nasce já no valor atual, sem varrer do zero.
function useProgressoQueAnda(alvo: number) {
  const [valor] = useState(() => new Animated.Value(alvo));
  useEffect(() => {
    let vivo = true;
    let anim: Animated.CompositeAnimation | null = null;
    movimentoReduzido().then((reduzido) => {
      if (!vivo) return;
      if (reduzido) {
        valor.setValue(alvo);
        return;
      }
      anim = Animated.timing(valor, { toValue: alvo, duration: MS.entrada, easing: EASE.entrada, useNativeDriver: false });
      anim.start();
    });
    return () => {
      vivo = false;
      anim?.stop();
    };
  }, [alvo, valor]);
  return valor;
}
