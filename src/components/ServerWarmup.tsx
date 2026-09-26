import { useEffect, useState } from "react";
import { Animated, AccessibilityInfo, Easing, View, Text } from "react-native";
import { Smartphone, Store, Scissors, Footprints } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { NwButton } from "@components/nw/Button";

// Tela do portao de readiness / cold start (ver src/lib/readiness.ts). Enquanto
// o backend acorda (Render Free, ~50s), seguramos o app aqui — login/cadastro
// so liberam apos UP.
//
// [backlog #2] Animacao de ABERTURA (branded, leve): sequencia de icones que
// remete a RAPIDEZ (abrir app -> entrar na loja -> sentar na cadeira -> sair),
// cada um entra com fade+scale (+micro-deslocamento) e sai encolhendo. Linha
// unica verde da marca. Respeita reduce-motion (fallback: troca simples sem
// movimento). Quando o design entregar os icones/JSON, trocar por Lottie.

const GREEN = "#163300"; // [marca-vupth] $forest — o `color` do lucide nao aceita token
const STEPS: { icon: LucideIcon; label: string }[] = [
  { icon: Smartphone, label: "Abrindo o app" },
  { icon: Store, label: "Chegando na loja" },
  { icon: Scissors, label: "Na cadeira" },
  { icon: Footprints, label: "Pronto, sem fila" },
];

const ICON_MS = 800; // tempo por icone (~0.8s)

// 🔁 16/09 — desenho do client (Pencil CLIENT · 23), escolhido pelo Andre para
// os dois apps: icone num badge redondo greenTint, titulo por passo, legenda do
// ~50s e pontos de progresso. Antes era so o icone solto + "Preparando
// servidor...", e os dois apps abriam de jeitos diferentes.
function Dots({ activeIndex }: { activeIndex: number }) {
  return (
    <View className="flex-row items-center gap-2" testID="warmup-dots">
      {STEPS.map((_, i) => {
        const active = i === activeIndex;
        return (
          <View
            key={i}
            className={`rounded-full ${active ? "w-2.5 h-2.5 bg-vupth-green" : "w-[7px] h-[7px] bg-vupth-border"}`}
          />
        );
      })}
    </View>
  );
}

function WarmupAnimation() {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const [opacity] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(0.6));
  const [shiftX] = useState(() => new Animated.Value(-6));

  // Preferencia de reduce-motion (acessibilidade).
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub?.remove?.();
  }, []);

  // Avanca os icones; com motion roda a saida (encolhe+some) antes de trocar.
  useEffect(() => {
    let cancelled = false;
    const id = setInterval(() => {
      if (cancelled) return;
      if (reduceMotion) {
        setIndex((i) => (i + 1) % STEPS.length);
        return;
      }
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.6, duration: 220, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished && !cancelled) setIndex((i) => (i + 1) % STEPS.length);
      });
    }, ICON_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // opacity/scale sao Animated.Value estaveis (useState) — re-rodar so em reduceMotion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  // Entrada do icone atual (fade + scale + micro-deslocamento "avancar").
  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      scale.setValue(1);
      shiftX.setValue(0);
      return;
    }
    opacity.setValue(0);
    scale.setValue(0.6);
    shiftX.setValue(-6);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(shiftX, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    // opacity/scale/shiftX sao Animated.Value estaveis (useState).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, reduceMotion]);

  const Icon = STEPS[index].icon;

  return (
    <View className="items-center gap-4">
      <Animated.View style={{ opacity, transform: [{ scale }, { translateX: shiftX }] }}>
        <View className="w-[88px] h-[88px] rounded-full bg-vupth-greenTint items-center justify-center">
          <Icon size={38} color={GREEN} />
        </View>
      </Animated.View>
      <View className="items-center gap-1">
        <Text className="font-display text-xl text-vupth-forest">{STEPS[index].label}</Text>
        <Text className="font-body text-xs text-vupth-textSecondary text-center w-[260px]">
          Preparando servidor — na primeira vez pode levar até ~50s.
        </Text>
      </View>
      <Dots activeIndex={index} />
    </View>
  );
}

type Props = {
  failed?: boolean;
  onRetry?: () => void;
};

export function ServerWarmup({ failed, onRetry }: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <View className="items-center gap-4 w-full">
        {failed ? (
          <>
            <Text className="font-heading text-lg text-vupth-textSecondary text-center">
              Não foi possível conectar ao servidor
            </Text>
            <Text className="font-body text-sm text-vupth-textSecondary text-center">
              O servidor pode estar iniciando. Tente novamente em alguns segundos.
            </Text>
            {onRetry && (
              <NwButton title="Tentar de novo" onPress={onRetry} className="self-stretch mt-5" />
            )}
          </>
        ) : (
          <WarmupAnimation />
        )}
      </View>
    </View>
  );
}
