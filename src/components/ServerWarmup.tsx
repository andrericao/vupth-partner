import { useEffect, useState } from "react";
import { Animated, Easing, View, Text } from "react-native";
import { NwButton } from "@components/nw/Button";
import { CommitDoCodigo } from "@components/CommitDoCodigo";

// Tela do portao de readiness (ver src/lib/readiness.ts): o app espera a API
// responder antes de liberar login e cadastro.
//
// abertura-profissional (PAR-10, DEC-40, Andre 15/10): "nao existe PREPARANDO
// SERVIDOR na producao [...] temos que ser profissional, nao passar a imagem de
// amador". A tela e a da marca: o V e um indicador discreto, sem citar
// servidor, API ou tempo de espera. O portao continua por baixo (no staging o
// cold start do Render segue existindo). Quando a Design entregar o V da
// abertura (icone-do-v), troca-se so o arquivo.
//
// abertura-v-pulsando (PAR-2, Andre 15/10): sem spinner — o V sem fundo
// pulsa de leve e devagar, so para dar a sensacao de carregando. O Client
// copia esta abertura (DEC-68).

const PULSO_MS = 1100; // meia volta: some de leve e volta, devagar
const LOGO_V = require("../../assets/logo-v.png");

type Props = {
  failed?: boolean;
  onRetry?: () => void;
};

function usePulso(ativo: boolean) {
  const [valor] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!ativo) {
      valor.setValue(0);
      return;
    }
    const ida = { duration: PULSO_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true };
    const laco = Animated.loop(
      Animated.sequence([
        Animated.timing(valor, { ...ida, toValue: 1 }),
        Animated.timing(valor, { ...ida, toValue: 0 }),
      ])
    );
    laco.start();
    return () => laco.stop();
  }, [ativo, valor]);
  return {
    opacity: valor.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] }),
    transform: [{ scale: valor.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }) }],
  };
}

export function ServerWarmup({ failed, onRetry }: Props) {
  const pulso = usePulso(!failed);
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <View className="items-center gap-6 w-full">
        <Animated.Image
          source={LOGO_V}
          resizeMode="contain"
          accessibilityLabel={failed ? "Vupth" : "Vupth, abrindo"}
          testID={failed ? "abertura-v" : "abertura-v-pulsando"}
          style={[{ width: 96, height: 80 }, failed ? null : pulso]}
        />
        {failed && (
          <>
            <View className="items-center gap-2">
              <Text className="font-heading text-lg text-vupth-forest text-center">
                Não foi possível abrir o app
              </Text>
              <Text className="font-body text-sm text-vupth-textSecondary text-center">
                Confira a sua internet e tente de novo.
              </Text>
            </View>
            {onRetry && (
              <NwButton title="Tentar de novo" onPress={onRetry} className="self-stretch mt-2" />
            )}
          </>
        )}
        {/* O commit ja na abertura: e a primeira tela que o Andre ve sem login
            (commit-visivel, 03/10). */}
        <CommitDoCodigo />
      </View>
    </View>
  );
}
