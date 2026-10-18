import { useMemo, useState } from "react";
import { View, Text, Pressable, Modal, Image, PanResponder, useWindowDimensions } from "react-native";
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
};

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** O quadrado da original que aparece no visor, com a foto arrastada em (dx, dy). */
export function recorteDoVisor(foto: { width: number; height: number }, visor: number, dx: number, dy: number): Recorte {
  const lado = Math.min(foto.width, foto.height);
  const escala = visor / lado;
  return {
    originX: Math.round(limitar(-dx / escala, 0, foto.width - lado)),
    originY: Math.round(limitar(-dy / escala, 0, foto.height - lado)),
    width: lado,
    height: lado,
  };
}

// foto-ux (Andre, 15/10): "a seleção de foto ainda está ruim, a UX está
// complicada, os botões não são claros". O recorte do Android (allowsEditing)
// tinha só ícones (✓, girar) e a bateria errava o toque. Agora o recorte é
// nosso, como no Instagram/WhatsApp: a foto num círculo, arrastar para
// enquadrar, e dois botões com texto — Cancelar e Usar foto.
export function EnquadrarFoto({ foto, onUsar, onCancelar, testID = "foto-editavel" }: Props) {
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
  const noCentro = { ...centro, ix: centro.x, iy: centro.y };
  const [pos, setPos] = useState(noCentro);
  const [chaveAnterior, setChaveAnterior] = useState(foto?.uri);
  if (chaveAnterior !== foto?.uri) {
    // Foto nova: volta ao centro.
    setChaveAnterior(foto?.uri);
    setPos(noCentro);
  }

  const arrastar = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => setPos((p) => ({ ...p, ix: p.x, iy: p.y })),
        onPanResponderMove: (_e, g) =>
          setPos((p) => ({
            ...p,
            x: limitar(p.ix + g.dx, visor - largura, 0),
            y: limitar(p.iy + g.dy, visor - altura, 0),
          })),
      }),
    [visor, largura, altura]
  );
  const usar = () => onUsar(temTamanho ? recorteDoVisor(foto as Required<FotoEscolhida>, visor, pos.x, pos.y) : undefined);

  return (
    <Modal visible={!!foto} animationType="fade" onRequestClose={onCancelar} statusBarTranslucent>
      {/* Fundo forest: icones claros na barra de status (PAR-3). Esta tela e
          forest nos DOIS temas (o mesmo hex): o texto branco, o recorte e o anel
          verde valem nos dois. */}
      <StatusBar style="light" />
      <View
        className="flex-1 bg-vupth-forest items-center justify-between px-4"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
      >
        <View className="items-center gap-1">
          {/* tema-fixo: tela forest nos dois temas, branco sobre forest passa nos dois */}
          <Text className="font-heading text-lg text-white">Ajuste a foto</Text>
          <Text className="font-body text-sm text-vupth-greenTint">Arraste para enquadrar no círculo</Text>
        </View>

        <View
          testID={`${testID}-visor`}
          style={{ width: visor, height: visor, overflow: "hidden" }}
          {...arrastar.panHandlers}
        >
          {foto && (
            <Image
              source={{ uri: foto.uri }}
              style={{ position: "absolute", width: largura, height: altura, left: pos.x, top: pos.y }}
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
            style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, borderRadius: visor / 2, borderWidth: 2, borderColor: cores.green }}
          />
        </View>

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
