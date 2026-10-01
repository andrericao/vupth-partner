import { View, Pressable } from "react-native";
import { Share2, Copy } from "lucide-react-native";
import { NwButton } from "@components/nw/Button";
import { compartilharComAviso } from "@lib/compartilharComAviso";
import { copiarComAviso } from "@lib/copiar";

type Props = {
  link: string;
  titulo: string;
  mensagem: string;
  /** Rotulo do botao: "Compartilhar perfil", "Compartilhar a loja". */
  rotulo?: string;
};

// Compartilhar + copiar lado a lado (Andre, 26/09): o botao do perfil e, ao lado,
// so o icone de copiar. Mora em Dados cadastrais (profissional) e em Dados do
// estabelecimento (dono).
export function CompartilharPerfil({ link, titulo, mensagem, rotulo = "Compartilhar perfil" }: Props) {
  return (
    <View className="flex-row items-center gap-2">
      <NwButton
        title={rotulo}
        variant="vupthOutline"
        icon={<Share2 size={18} color="#163300" />}
        onPress={() => compartilharComAviso(link, { titulo, mensagem })}
        className="flex-1"
      />
      <Pressable
        onPress={() => copiarComAviso(link, "Link")}
        accessibilityRole="button"
        accessibilityLabel="Copiar link"
        testID="copiar-link"
        className="w-[54px] h-[54px] rounded-full border-2 border-vupth-forest items-center justify-center active:bg-vupth-greenTint"
      >
        <Copy size={20} color="#163300" />
      </Pressable>
    </View>
  );
}
