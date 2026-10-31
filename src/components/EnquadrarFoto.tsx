import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  Image,
  PanResponder,
  NativeModules,
  TurboModuleRegistry,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import type { FotoEscolhida, Recorte } from "@lib/fotoDePerfil";
import { useTema } from "@hooks/useTema";

type Props = {
  foto: FotoEscolhida | null;
  /** Usar foto: o quadrado escolhido, em pixels da original (sem tamanho: undefined). */
  onUsar: (recorte: Recorte | undefined) => void;
  onCancelar: () => void;
  testID?: string;
  /** Injetavel nos testes. Sem a prop: o gesture-handler real, se o build o tiver (senao, null). */
  gh?: GestosNativos | null;
};

/** O que usamos do react-native-gesture-handler (zoom-na-foto-com-gesture-handler, 29/10). */
export type GestosNativos = {
  Gesture: {
    Pinch: () => Gesto;
    Pan: () => Gesto;
    Simultaneous: (...g: Gesto[]) => unknown;
  };
  GestureDetector: React.ComponentType<{
    gesture: never;
    children?: React.ReactNode;
  }>;
  GestureHandlerRootView: React.ComponentType<{
    style?: object;
    children?: React.ReactNode;
  }>;
};
type Gesto = {
  runOnJS: (v: boolean) => Gesto;
  onBegin: (f: () => void) => Gesto;
  onUpdate: (f: (e: { scale: number; translationX: number; translationY: number }) => void) => Gesto;
  onFinalize: (f: () => void) => Gesto;
};

/**
 * A partida do gesto nativo: a posicao em que a foto estava quando o primeiro dedo (pinca ou
 * arraste) encostou, mais a escala e o arraste de agora. Fora do React: so e lida e escrita
 * pelos callbacks do gesto.
 */
export function criarPartida() {
  let atual = { x: 0, y: 0, z: 1 };
  let inicio = { x: 0, y: 0, z: 1 };
  let ativos = 0;
  let escala = 1;
  let dx = 0;
  let dy = 0;
  return {
    sincronizar: (p: { x: number; y: number; z: number }) => {
      atual = { x: p.x, y: p.y, z: p.z };
    },
    comecar: () => {
      if (ativos++ === 0) {
        inicio = atual;
        escala = 1;
        dx = 0;
        dy = 0;
      }
    },
    terminar: () => {
      ativos = Math.max(0, ativos - 1);
    },
    pinca: (e: number) => {
      escala = e;
    },
    arrastar: (x: number, y: number) => {
      dx = x;
      dy = y;
    },
    reposicionar: (visor: number, largura: number, altura: number) =>
      reposicionar(inicio, escala, dx, dy, visor, largura, altura),
  };
}

/**
 * O gesture-handler so serve se o build nativo o tiver: o APK anterior nao tem o modulo
 * e o app quebraria. Sem ele, fica o PanResponder (que ja funciona para arrastar).
 */
export function carregarGestosNativos(
  nativo: unknown = TurboModuleRegistry.get("RNGestureHandlerModule") ?? NativeModules.RNGestureHandlerModule
): GestosNativos | null {
  try {
    if (!nativo) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-gesture-handler") as GestosNativos;
  } catch {
    return null;
  }
}

/**
 * Onde a foto fica, dada a partida do gesto (x0, y0, z0), a escala da pinca e o arraste:
 * o ponto sob o centro do visor fica no lugar enquanto o zoom muda.
 */
export function reposicionar(
  partida: { x: number; y: number; z: number },
  escala: number,
  dx: number,
  dy: number,
  visor: number,
  largura: number,
  altura: number
) {
  const z = limitar(partida.z * escala, 1, ZOOM_MAX);
  const c = visor / 2;
  return {
    z,
    x: limitar(c - ((c - partida.x) * z) / partida.z + dx, visor - largura * z, 0),
    y: limitar(c - ((c - partida.y) * z) / partida.z + dy, visor - altura * z, 0),
  };
}

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** O quadrado da original que aparece no visor, com a foto arrastada em (dx, dy). */
export function recorteDoVisor(
  foto: { width: number; height: number },
  visor: number,
  dx: number,
  dy: number,
  zoom = 1
): Recorte {
  const lado = Math.min(foto.width, foto.height) / zoom;
  const escala = visor / lado;
  return {
    originX: Math.round(limitar(-dx / escala, 0, foto.width - lado)),
    originY: Math.round(limitar(-dy / escala, 0, foto.height - lado)),
    width: Math.round(lado),
    height: Math.round(lado),
  };
}

/** zoom-na-foto (Andre, 29/10): de 1x (a foto toda no quadrado) ate 4x. */
export const ZOOM_MAX = 4;

type Toque = { pageX: number; pageY: number };
const distancia = (t: Toque[]) => Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);

/**
 * Os dedos na tela. O `nativeEvent.touches` e o normal; se vier com um so (alguns Androids em Modal),
 * o historico de toques do PanResponder (`touchHistory`) ainda sabe os que estao ativos.
 */
export function toquesAtivos(e: {
  nativeEvent?: { touches?: Toque[] };
  touchHistory?: {
    touchBank?: {
      touchActive?: boolean;
      currentPageX: number;
      currentPageY: number;
    }[];
  };
}): Toque[] {
  const nativos = e.nativeEvent?.touches ?? [];
  if (nativos.length >= 2) return nativos;
  const ativos = (e.touchHistory?.touchBank ?? [])
    .filter((t) => t && t.touchActive)
    .map((t) => ({ pageX: t.currentPageX, pageY: t.currentPageY }));
  return ativos.length >= 2 ? ativos : nativos;
}

// foto-ux (Andre, 15/10): "a seleção de foto ainda está ruim, a UX está
// complicada, os botões não são claros". O recorte do Android (allowsEditing)
// tinha só ícones (✓, girar) e a bateria errava o toque. Agora o recorte é
// nosso, como no Instagram/WhatsApp: a foto num círculo, arrastar para
// enquadrar, e dois botões com texto — Cancelar e Usar foto.
export function EnquadrarFoto({ foto, onUsar, onCancelar, testID = "foto-editavel", gh: ghInjetado }: Props) {
  const [ghReal] = useState(() => (ghInjetado === undefined ? carregarGestosNativos() : ghInjetado));
  const gh = ghReal;
  const insets = useSafeAreaInsets();
  const { cores } = useTema();
  const { width: larguraDaTela } = useWindowDimensions();
  const visor = Math.min(larguraDaTela - 32, 320);
  const temTamanho = !!foto?.width && !!foto?.height;
  const escala = temTamanho ? visor / Math.min(foto!.width!, foto!.height!) : 1;
  const largura = temTamanho ? foto!.width! * escala : visor;
  const altura = temTamanho ? foto!.height! * escala : visor;
  const centro = { x: (visor - largura) / 2, y: (visor - altura) / 2 };

  // x/y: onde a foto esta; ix/iy: onde estava quando o dedo encostou.
  const noCentro = {
    ...centro,
    ix: centro.x,
    iy: centro.y,
    z: 1,
    g: { dedos: 1, d0: 0, z0: 1, bx: 0, by: 0 },
  };
  const [pos, setPos] = useState(noCentro);
  const [chaveAnterior, setChaveAnterior] = useState(foto?.uri);
  if (chaveAnterior !== foto?.uri) {
    // Foto nova: volta ao centro.
    setChaveAnterior(foto?.uri);
    setPos(noCentro);
  }

  // Gesto: um dedo arrasta; dois dedos (pinca) ampliam em torno do centro do visor. Ao mudar
  // o numero de dedos o gesto recomeca (nova base), senao a foto pularia. A base vive no
  // proprio estado (g: dedos, distancia, zoom e arraste de partida).
  const arrastar = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () =>
          setPos((p) => ({
            ...p,
            ix: p.x,
            iy: p.y,
            g: { dedos: 1, d0: 0, z0: p.z, bx: 0, by: 0 },
          })),
        onPanResponderMove: (e, gs) => {
          const toques = toquesAtivos(e as unknown as Parameters<typeof toquesAtivos>[0]);
          const dedos = toques.length >= 2 ? 2 : 1;
          const dist = dedos === 2 ? distancia(toques) || 1 : 0;
          setPos((p) => {
            if (dedos !== p.g.dedos) {
              return {
                ...p,
                ix: p.x,
                iy: p.y,
                g: { dedos, d0: dist, z0: p.z, bx: gs.dx, by: gs.dy },
              };
            }
            const r = reposicionar(
              { x: p.ix, y: p.iy, z: p.g.z0 },
              dedos === 2 ? dist / p.g.d0 : p.z / p.g.z0,
              gs.dx - p.g.bx,
              gs.dy - p.g.by,
              visor,
              largura,
              altura
            );
            return { ...p, ...r };
          });
        },
      }),
    [visor, largura, altura]
  );
  // Com o gesture-handler: pinca + arraste ao mesmo tempo. A partida (x, y, z) e tirada
  // quando o primeiro gesto comeca, e cada quadro recalcula a partir dela.
  const [partida] = useState(criarPartida);
  useEffect(() => {
    partida.sincronizar(pos);
  }, [partida, pos]);
  const nativo = useMemo(() => {
    if (!gh) return null;
    const aplicar = () =>
      setPos((p) => ({
        ...p,
        ...partida.reposicionar(visor, largura, altura),
      }));
    const pinca = gh.Gesture.Pinch()
      .runOnJS(true)
      .onBegin(partida.comecar)
      .onUpdate((e) => {
        partida.pinca(e.scale);
        aplicar();
      })
      .onFinalize(partida.terminar);
    const arraste = gh.Gesture.Pan()
      .runOnJS(true)
      .onBegin(partida.comecar)
      .onUpdate((e) => {
        partida.arrastar(e.translationX, e.translationY);
        aplicar();
      })
      .onFinalize(partida.terminar);
    return gh.Gesture.Simultaneous(pinca, arraste);
  }, [gh, partida, visor, largura, altura]);
  const usar = () =>
    onUsar(temTamanho ? recorteDoVisor(foto as Required<FotoEscolhida>, visor, pos.x, pos.y, pos.z) : undefined);

  return (
    <Modal visible={!!foto} animationType="fade" onRequestClose={onCancelar} statusBarTranslucent>
      {/* Fundo forest: icones claros na barra de status (PAR-3). Esta tela e
          forest nos DOIS temas (o mesmo hex): o texto branco, o recorte e o anel
          verde valem nos dois. */}
      <StatusBar style="light" />
      <View
        className="flex-1 bg-vupth-forest items-center justify-between px-4"
        style={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="items-center gap-1">
          {/* tema-fixo: tela forest nos dois temas, branco sobre forest passa nos dois */}
          <Text className="font-heading text-lg text-white">Ajuste a foto</Text>
          <Text className="font-body text-sm text-vupth-greenTint">Arraste para enquadrar no círculo</Text>
        </View>

        {nativo && gh ? (
          <gh.GestureHandlerRootView style={{ width: visor, height: visor }}>
            <gh.GestureDetector gesture={nativo as never}>
              <View
                testID={`${testID}-visor`}
                style={{ width: visor, height: visor, overflow: "hidden" }}
                {...(nativo ? {} : arrastar.panHandlers)}
              >
                {foto && (
                  <Image
                    source={{ uri: foto.uri }}
                    style={{
                      position: "absolute",
                      width: largura * pos.z,
                      height: altura * pos.z,
                      left: pos.x,
                      top: pos.y,
                    }}
                    resizeMode={temTamanho ? "stretch" : "cover"}
                  />
                )}
                {/* O círculo: a borda grossa escurece os cantos, como a foto vai aparecer. */}
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: -visor / 2,
                    top: -visor / 2,
                    width: visor * 2,
                    height: visor * 2,
                    borderRadius: visor,
                    borderWidth: visor / 2,
                    // tema-fixo: forest a 60%, escurece os cantos do recorte sobre a foto
                    borderColor: "rgba(22,51,0,0.6)",
                  }}
                />
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: visor / 2,
                    borderWidth: 2,
                    borderColor: cores.green,
                  }}
                />
              </View>
            </gh.GestureDetector>
          </gh.GestureHandlerRootView>
        ) : (
          <View
            testID={`${testID}-visor`}
            style={{ width: visor, height: visor, overflow: "hidden" }}
            {...(nativo ? {} : arrastar.panHandlers)}
          >
            {foto && (
              <Image
                source={{ uri: foto.uri }}
                style={{
                  position: "absolute",
                  width: largura * pos.z,
                  height: altura * pos.z,
                  left: pos.x,
                  top: pos.y,
                }}
                resizeMode={temTamanho ? "stretch" : "cover"}
              />
            )}
            {/* O círculo: a borda grossa escurece os cantos, como a foto vai aparecer. */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: -visor / 2,
                top: -visor / 2,
                width: visor * 2,
                height: visor * 2,
                borderRadius: visor,
                borderWidth: visor / 2,
                // tema-fixo: forest a 60%, escurece os cantos do recorte sobre a foto
                borderColor: "rgba(22,51,0,0.6)",
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                borderRadius: visor / 2,
                borderWidth: 2,
                borderColor: cores.green,
              }}
            />
          </View>
        )}

        <View className="flex-row gap-3 self-stretch">
          <Pressable
            testID={`${testID}-recorte-cancelar`}
            accessibilityRole="button"
            onPress={onCancelar}
            // tema-fixo: botao vazado sobre o forest da tela, branco nos dois temas
            className="flex-1 items-center py-4 rounded-card border-2 border-white active:opacity-70"
          >
            {/* tema-fixo: idem */}
            <Text className="font-heading text-md text-white">Cancelar</Text>
          </Pressable>
          <Pressable
            testID={`${testID}-usar`}
            accessibilityRole="button"
            onPress={usar}
            className="flex-1 items-center py-4 rounded-card bg-vupth-green active:opacity-80"
          >
            <Text className="font-heading text-md text-vupth-onGreen">Usar foto</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
