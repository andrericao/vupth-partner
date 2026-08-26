import { View, Text, Pressable } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { router } from "expo-router";
import { Titulo } from "@components/Titulo";

// Bloco de BLOQUEIO: "voce nao consegue usar esta tela, e este e o passo que
// destrava". Nao confundir com estado VAZIO ("nada aqui ainda, e esta tudo
// certo") — vazio e calmo, bloqueio e acento.
//
// [marca-vupth] A forma vem do unico bloqueio DESENHADO no arquivo de design
// ("409 AGENDA CHEIA"): pessego, raio 20, padding 16, gap 10, SEM borda, e a
// acao como TEXTO + SETA em vez de botao cheio — botao solido aqui gastaria um
// segundo acento dentro de um cartao que ja e acento.
//
// ⚠️ UMA divergencia deliberada: la o titulo e 13/700 e o texto 14, ou seja, o
// titulo e MENOR que o corpo. Aquilo funciona porque "AGENDA CHEIA" e um
// rotulo curto. Aqui o titulo e uma frase inteira e e a manchete do bloco —
// manchete menor que o proprio corpo inverte a hierarquia. Entao ele e um
// `Titulo nivel={2}` ("Titulo de Secao" da escala), que alem do tamanho traz a
// semantica de cabecalho.
type Props = {
  titulo: string;
  texto: string;
  acao: string;
  rota: string;
};

export function BlocoBloqueio({ titulo, texto, acao, rota }: Props) {
  return (
    <View className="bg-vupth-accentPeach rounded-[20px] p-4 gap-2.5">
      <Titulo nivel={2}>{titulo}</Titulo>
      <Text className="font-body text-[14px] leading-5 text-vupth-forest">{texto}</Text>
      <Pressable
        onPress={() => router.push(rota as any)}
        className="flex-row items-center gap-1.5 mt-0.5 active:opacity-70"
        accessibilityRole="button"
      >
        <Text className="font-heading text-[14px] text-vupth-forest">{acao}</Text>
        <ArrowRight size={16} color="#163300" />
      </Pressable>
    </View>
  );
}
