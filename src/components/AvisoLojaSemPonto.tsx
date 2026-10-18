import { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { MapPin, ArrowRight } from "lucide-react-native";
import { router } from "expo-router";
import { situacaoDoPonto } from "@lib/pontoNoMapa";
import { useEntradaDoAviso } from "@hooks/useEntradaDoAviso";

// loja-sem-coordenada (S25, contrato BAK d215d5a). Sem ponto no mapa a loja
// some da busca por proximidade, e ate aqui o dono nao tinha como saber.
//  - UNRESOLVED: o aviso, que leva ao endereco ("Usar minha localizacao" ou
//    corrigir o texto — os dois estao la);
//  - PENDING: o geocoding leva segundos — nada na tela, a loja e relida a
//    cada 5 s, ate 6 vezes (se o backend nao resolver, nao fica em laco).
//
// E BLOQUEIO, nao vazio (DESIGN.md §4): a loja nao aparece na busca e este e o
// passo que destrava. Por isso pessego liso, sem borda e sem o fundo surface —
// a borda pessego sobre surface da 1,5:1 e some (validacao de 17/10, DS6). A
// acao e texto + seta, como no BlocoBloqueio; "Usar localizacao" e o rotulo do
// guia de texto (o aviso ja diz que o endereco tambem pode ser corrigido).
const INTERVALO_MS = 5000;
const MAX_RELEITURAS = 6;

type Props = {
  endereco: { locationStatus?: string | null } | null | undefined;
  /** Rele a loja (fetchMine) — o PENDING vira LOCATED ou UNRESOLVED. */
  onReler: () => void;
};

export function AvisoLojaSemPonto({ endereco, onReler }: Props) {
  const situacao = situacaoDoPonto(endereco);
  const releituras = useRef(0);
  const entrada = useEntradaDoAviso(situacao === "sem-ponto");

  useEffect(() => {
    if (situacao !== "localizando" || releituras.current >= MAX_RELEITURAS) return;
    const t = setTimeout(() => {
      releituras.current += 1;
      onReler();
    }, INTERVALO_MS);
    return () => clearTimeout(t);
    // endereco no deps: cada releitura traz um objeto novo e rearma o timer.
  }, [situacao, endereco, onReler]);

  if (situacao !== "sem-ponto") return null;

  // Animated.View nao resolve className do NativeWind: o movimento fica na
  // casca e o visual no View de dentro.
  return (
    <Animated.View testID="aviso-loja-sem-ponto" style={entrada}>
      <View className="bg-vupth-accentPeach rounded-card p-4 mt-4 gap-2">
        <View className="flex-row items-center gap-2">
          <MapPin size={16} color="#163300" />
          <Text className="font-display text-sm text-vupth-forest flex-1">
            Sua loja não aparece para quem busca por perto
          </Text>
        </View>
        <Text className="font-body text-xs text-vupth-forest">
          Não achamos o endereço no mapa. Na loja, use a localização do aparelho — ou confira o endereço.
        </Text>
        <Pressable
          onPress={() => router.push("/(owner)/onboarding/address" as any)}
          accessibilityRole="button"
          hitSlop={8}
          className="flex-row items-center gap-1 self-start"
        >
          <Text className="font-heading text-sm text-vupth-forest">Usar localização</Text>
          <ArrowRight size={16} color="#163300" />
        </Pressable>
      </View>
    </Animated.View>
  );
}
