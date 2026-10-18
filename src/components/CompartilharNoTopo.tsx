import { Pressable } from "react-native";
import { Share2 } from "lucide-react-native";
import { compartilharComAviso } from "@lib/compartilharComAviso";
import { useTema } from "@hooks/useTema";

type Props = {
  link: string;
  titulo: string;
  mensagem: string;
  /** Rotulo de acessibilidade: "Compartilhar meu perfil", "Compartilhar a loja". */
  rotulo: string;
};

// compartilhar-no-topo (Andre, 05/10): no canto direito do cabecalho da tela de
// status, como no app do GitHub. Mesmo tamanho dos botoes do cabecalho (40).
export function CompartilharNoTopo({ link, titulo, mensagem, rotulo }: Props) {
  const { cores } = useTema();
  return (
    <Pressable
      onPress={() => compartilharComAviso(link, { titulo, mensagem })}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      testID="compartilhar-no-topo"
      hitSlop={8}
      className="w-10 h-10 rounded-xl bg-vupth-surface items-center justify-center active:bg-vupth-greenTint"
    >
      <Share2 size={20} color={cores.textPrimary} />
    </Pressable>
  );
}
