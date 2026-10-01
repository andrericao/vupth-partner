import { View, Pressable } from "react-native";
import { Camera } from "lucide-react-native";
import { Avatar } from "@components/Avatar";

type Props = {
  nome?: string | null;
  uri?: string | null;
  onEditar: () => void;
  tamanho?: number;
  /** "Trocar foto de perfil", "Trocar foto da loja"… */
  rotulo: string;
  testID?: string;
};

// Foto com o selo de edicao no canto inferior direito — o padrao de mercado
// (Instagram, WhatsApp, iFood): a foto grande e um circulo pequeno com a camera.
// Pedido do Andre (26/09): "o link de edicao deve ser apenas uma caneta/camera
// no canto inferior da foto". Toda a foto e tocavel; o selo so indica.
export function FotoEditavel({ nome, uri, onEditar, tamanho = 96, rotulo, testID = "foto-editavel" }: Props) {
  const selo = Math.round(tamanho * 0.32);
  return (
    <Pressable
      onPress={onEditar}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      testID={testID}
      className="self-center active:opacity-80"
    >
      <Avatar nome={nome} uri={uri} tamanho={tamanho} testID={`${testID}-avatar`} />
      <View
        testID={`${testID}-selo`}
        className="absolute bg-vupth-forest items-center justify-center border-2 border-white"
        style={{ width: selo, height: selo, borderRadius: selo / 2, right: 0, bottom: 0 }}
      >
        <Camera size={Math.round(selo * 0.5)} color="#9FE870" />
      </View>
    </Pressable>
  );
}
