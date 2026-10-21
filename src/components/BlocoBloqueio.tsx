import { View, Text } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { NwButton } from "@components/nw/Button";
import { router } from "expo-router";
import { Titulo } from "@components/Titulo";
import { useTema } from "@hooks/useTema";

// Bloco de BLOQUEIO: "voce nao consegue usar esta tela, e este e o passo que
// destrava". Nao confundir com estado VAZIO ("nada aqui ainda, e esta tudo
// certo") — vazio e calmo, bloqueio e acento.
//
// [marca-vupth] A forma vem do unico bloqueio DESENHADO no arquivo de design
// ("409 AGENDA CHEIA"): pessego, raio 20, padding 16, gap 10, SEM borda, e a
// acao como TEXTO + SETA em vez de botao cheio — botao solido aqui gastaria um
// segundo acento dentro de um cartao que ja e acento.
//
// ⚠️ REVISTO em 2026-08-26 a pedido do design: a acao voltou a ser BOTAO, mas
// na variante `Secondary` (forest). O argumento de "dois acentos" valia contra
// o botao verde-CLARO; um botao escuro nao empilha acento, ancora.
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
  const { cores } = useTema();
  return (
    // bordas-do-card (Andre, 05/10 e 10/10): "caixa laranja quase sem borda" e o
    // botao colado na borda de baixo. Borda em forest a 20% (sem token novo) e
    // mais folga embaixo do botao.
    <View testID="bloco-bloqueio" className="bg-vupth-accentPeach border-2 border-vupth-onAccentPeach/20 rounded-card p-4 pb-6 gap-2.5">
      <Titulo nivel={2}>{titulo}</Titulo>
      <Text className="font-body text-f14 leading-5 text-vupth-onAccentPeach">{texto}</Text>
      {/* Button/Secondary do desenho: fundo `forest`, rotulo e seta em
          `brand-green`. E a unica variante que segura peso DENTRO de um cartao
          que ja e acento — `primary` seria verde-claro sobre pessego, duas
          cores claras sem separacao. Aqui o escuro ancora em vez de competir.
          `self-start` porque a pilula inteira na largura do cartao grita mais
          do que a mensagem que a precede. */}
      <NwButton
        title={acao}
        variant="vupthSecondary"
        onPress={() => router.push(rota as any)}
        className="h-12 px-6 self-start mt-1"
        icon={<ArrowRight size={18} color={cores.green} />}
      />
    </View>
  );
}
