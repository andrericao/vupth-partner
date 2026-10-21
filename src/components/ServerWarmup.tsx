import { useEffect, useRef, useState } from "react";
import { Animated, Easing, View, Text, useWindowDimensions } from "react-native";
import { NwButton } from "@components/nw/Button";
import { CommitDoCodigo } from "@components/CommitDoCodigo";
import { EASE, MS, movimentoReduzido } from "@lib/motion";
import { useTema } from "@hooks/useTema";

// Tela do portao de readiness (ver src/lib/readiness.ts): o app espera a API
// responder antes de liberar login e cadastro.
//
// abertura-profissional (PAR-10, DEC-40, Andre 15/10): "nao existe PREPARANDO
// SERVIDOR na producao [...] temos que ser profissional, nao passar a imagem de
// amador". A tela e a da marca: o V e um indicador discreto, sem citar
// servidor, API ou tempo de espera. O portao continua por baixo (no staging o
// cold start do Render segue existindo).
//
// abertura-v-pulsando (PAR-2, Andre 15/10): sem spinner — o V sem fundo
// pulsa de leve e devagar, so para dar a sensacao de carregando. O Client
// copia esta abertura (DEC-68).
//
// abertura-sem-piscar (18/10): o pulso escurecia o V ate 55% de opacidade a cada
// ciclo, e na tela de saida o V sumia de uma vez. Agora o V ENTRA por varredura
// (o splash do Partner nao tem V, entao ele nunca aparece pela metade de outro
// jeito), pulsa so de 1 a 0,92 e SAI inteiro para a esquerda quando o portao
// abre. Nao ha mais minimo de splash: o unico tempo fixo e a varredura.
//
// Tema (DEC-75): a abertura SEGUE o tema. O fundo e o `background` e, no escuro,
// o V passa a green (design.html#tokens-escuros: "o V e o icone em verde, so no
// escuro", 12,25:1 sobre o background). O layout raiz so mostra esta tela depois
// de ler o tema do aparelho, entao quem escolheu o escuro nao ve um clarao
// branco. No claro nada muda: o V segue o PNG como esta.

const LOGO_V = require("../../assets/logo-v.png");
const V = { width: 96, height: 80 };
const VARREDURA_MS = 600;

type Props = {
  failed?: boolean;
  onRetry?: () => void;
  /** Portao aberto: o V sai e `onSaiu` avisa quando a tela ja pode ser trocada. */
  pronto?: boolean;
  onSaiu?: () => void;
};

export function ServerWarmup({ failed, onRetry, pronto = false, onSaiu }: Props) {
  const { width } = useWindowDimensions();
  const { escuro, cores } = useTema();
  // O PNG do V e uma forma so, com transparencia: `tintColor` o repinta inteiro.
  // Forest sobre o fundo escuro seria 1:1, entao la o V e green.
  const tinta = escuro ? { tintColor: cores.green } : null;
  const [varredura] = useState(() => new Animated.Value(0));
  const [deslize] = useState(() => new Animated.Value(0));
  const [pulso] = useState(() => new Animated.Value(0));
  const [saida] = useState(() => new Animated.Value(0));
  const [entrou, setEntrou] = useState(false);
  const laco = useRef<Animated.CompositeAnimation | null>(null);
  const vivo = useRef(true);
  const aoSair = useRef(onSaiu);

  // O callback e lido na hora de sair, nao na de montar.
  useEffect(() => {
    aoSair.current = onSaiu;
  }, [onSaiu]);

  // Entrada por varredura, e depois o pulso. Falhou: o V fica parado e inteiro.
  useEffect(() => {
    vivo.current = true;
    if (failed) return;
    varredura.setValue(0);
    deslize.setValue(0);
    let entrada: Animated.CompositeAnimation | null = null;
    movimentoReduzido().then((reduzido) => {
      if (!vivo.current) return;
      if (reduzido) {
        varredura.setValue(1);
        deslize.setValue(1);
        setEntrou(true);
        return;
      }
      entrada = Animated.parallel([
        // A largura nao roda no driver nativo; e so uma View de 96 px.
        Animated.timing(varredura, { toValue: 1, duration: VARREDURA_MS, easing: EASE.varredura, useNativeDriver: false }),
        Animated.timing(deslize, { toValue: 1, duration: VARREDURA_MS, easing: EASE.varredura, useNativeDriver: true }),
      ]);
      entrada.start(({ finished }) => {
        if (!finished || !vivo.current) return;
        setEntrou(true);
        const meia = { duration: MS.pulso, easing: Easing.inOut(Easing.ease), useNativeDriver: true };
        laco.current = Animated.loop(
          Animated.sequence([
            Animated.timing(pulso, { ...meia, toValue: 1 }),
            Animated.timing(pulso, { ...meia, toValue: 0 }),
          ])
        );
        laco.current.start();
      });
    });
    return () => {
      vivo.current = false;
      entrada?.stop();
      laco.current?.stop();
      // Falhou e tentou de novo: o V entra outra vez, e a saida precisa esperar
      // esta nova varredura, nao a da tentativa anterior.
      setEntrou(false);
    };
  }, [failed, varredura, deslize, pulso]);

  // O portao pode abrir antes de a varredura acabar (staging quente): a saida
  // espera o V estar inteiro, senao ele sairia cortado pela metade.
  useEffect(() => {
    if (!pronto || !entrou || failed) return;
    laco.current?.stop();
    movimentoReduzido().then((reduzido) => {
      if (!vivo.current) return;
      if (reduzido) {
        aoSair.current?.();
        return;
      }
      Animated.timing(saida, { toValue: 1, duration: MS.saida, easing: EASE.saida, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished && vivo.current) aoSair.current?.();
        }
      );
    });
  }, [pronto, entrou, failed, saida]);

  return (
    <View className="flex-1 items-center justify-center bg-vupth-background px-6">
      <View className="items-center gap-6 w-full">
        {failed ? (
          <Animated.Image
            source={LOGO_V}
            resizeMode="contain"
            accessibilityLabel="Vupth"
            testID="abertura-v"
            style={[V, tinta]}
          />
        ) : (
          <Animated.View
            style={{
              transform: [{ translateX: saida.interpolate({ inputRange: [0, 1], outputRange: [0, -(width / 2 + V.width)] }) }],
              opacity: saida.interpolate({ inputRange: [0, 0.8], outputRange: [1, 0], extrapolate: "clamp" }),
            }}
          >
            <Animated.View
              accessible
              accessibilityLabel="Vupth, abrindo"
              testID="abertura-v-pulsando"
              style={[
                V,
                {
                  opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] }),
                  transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }],
                },
              ]}
            >
              <Animated.View
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: V.height,
                  overflow: "hidden",
                  width: varredura.interpolate({ inputRange: [0, 1], outputRange: [0, V.width] }),
                }}
              >
                <Animated.Image
                  source={LOGO_V}
                  resizeMode="contain"
                  style={[V, tinta, { transform: [{ translateX: deslize.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}
                />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        )}
        {failed && (
          <>
            <View className="items-center gap-2">
              <Text className="font-heading text-lg text-vupth-textPrimary text-center">
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
