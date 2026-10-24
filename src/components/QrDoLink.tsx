import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { QrCode } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { NwButton } from "@components/nw/Button";
import { useTema } from "@hooks/useTema";

// tema-fixo: o leitor de QR precisa de preto sobre branco nos dois temas
const [QR_TRACO, QR_FUNDO] = ["#000000", "#FFFFFF"];

type Props = {
  /** O link de divulgacao (da loja ou do perfil), o mesmo do compartilhar. */
  link: string;
  /** O que o QR leva: "da loja" ou "do perfil", para o titulo e a acessibilidade. */
  alvo: string;
  testID?: string;
};

// qr-da-loja-e-do-perfil (Andre, 22/10): o profissional ou o dono gera o QR Code
// do link de divulgacao para mostrar no celular ou imprimir (print da tela).
// Branco com modulos pretos nos dois temas: leitor de QR precisa do contraste
// cheio, nao do tema do app.
export function QrDoLink({ link, alvo, testID = "qr-do-link" }: Props) {
  const { cores, veu } = useTema();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={`QR Code ${alvo}`}
        testID={`${testID}-abrir`}
        hitSlop={8}
        className="self-center w-12 h-12 rounded-full border-2 border-vupth-textPrimary items-center justify-center active:bg-vupth-greenTint"
      >
        <QrCode size={20} color={cores.textPrimary} />
      </Pressable>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <View className="flex-1 justify-center px-6" style={{ backgroundColor: veu }}>
          <View className="bg-vupth-painel rounded-card p-6 gap-4 items-center">
            <Text className="font-heading text-lg text-vupth-textPrimary">QR Code {alvo}</Text>
            <View testID={`${testID}-codigo`} style={{ backgroundColor: QR_FUNDO, padding: 16, borderRadius: 12 }}>
              <QRCode value={link} size={220} color={QR_TRACO} backgroundColor={QR_FUNDO} />
            </View>
            <Text className="font-body text-xs text-vupth-textSecondary text-center">
              Mostre na tela ou tire um print para imprimir.
            </Text>
            <NwButton title="Fechar" variant="vupthSecondary" onPress={() => setAberto(false)} testID={`${testID}-fechar`} />
          </View>
        </View>
      </Modal>
    </>
  );
}
