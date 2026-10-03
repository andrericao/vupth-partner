import { useEffect, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import { MapPin } from "lucide-react-native";
import { router } from "expo-router";
import { situacaoDoPonto } from "@lib/pontoNoMapa";

// loja-sem-coordenada (S25, contrato BAK d215d5a). Sem ponto no mapa a loja
// some da busca por proximidade, e ate aqui o dono nao tinha como saber.
//  - UNRESOLVED: o aviso, que leva ao endereco ("Usar minha localizacao" ou
//    corrigir o texto — os dois estao la);
//  - PENDING: o geocoding leva segundos — nada na tela, a loja e relida a
//    cada 5 s, ate 6 vezes (se o backend nao resolver, nao fica em laco).
// Tom ambar, como os avisos que pedem acao (ver o pausado no painel).
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

  return (
    <View
      testID="aviso-loja-sem-ponto"
      className="bg-vupth-surface border border-vupth-warning rounded-card p-4 mt-4 gap-2"
    >
      <View className="flex-row items-center gap-2">
        <MapPin size={16} color="#163300" />
        <Text className="font-display text-sm text-vupth-forest flex-1">
          Sua loja não aparece para quem busca por perto
        </Text>
      </View>
      <Text className="font-body text-xs text-vupth-textSecondary">
        Não achamos o endereço no mapa. Na loja, use a localização do aparelho — ou confira o endereço.
      </Text>
      <Pressable
        onPress={() => router.push("/(owner)/onboarding/address" as any)}
        accessibilityRole="button"
        hitSlop={8}
      >
        <Text className="font-heading text-sm text-vupth-forest underline">
          Usar minha localização ou corrigir o endereço
        </Text>
      </Pressable>
    </View>
  );
}
