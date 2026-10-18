import { Pressable } from "react-native";
import { Share2 } from "lucide-react-native";
import { compartilharComAviso } from "@lib/compartilharComAviso";
import { useTema } from "@hooks/useTema";

type Props = {
  link: string;
  titulo: string;
  mensagem: string;
  /** Rotulo de acessibilidade: "Compartilhar perfil", "Compartilhar a loja". */
  rotulo?: string;
};

// So o icone de compartilhar (Andre, 27/09): o menu do sistema ja oferece as
// redes e o "copiar" — um botao de copiar ao lado era repeticao. Mora em Dados
// cadastrais (profissional) e em Dados do estabelecimento (dono).
export function CompartilharPerfil({ link, titulo, mensagem, rotulo = "Compartilhar perfil" }: Props) {
  const { cores } = useTema();
  return (
    <Pressable
      onPress={() => compartilharComAviso(link, { titulo, mensagem })}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      testID="compartilhar-perfil"
      hitSlop={8}
      className="self-center w-12 h-12 rounded-full border-2 border-vupth-textPrimary items-center justify-center active:bg-vupth-greenTint"
    >
      <Share2 size={20} color={cores.textPrimary} />
    </Pressable>
  );
}
