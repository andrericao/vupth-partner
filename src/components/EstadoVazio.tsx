import { View, Text } from "react-native";

import { Doodle } from "@components/Doodle";
import type { DoodleName } from "@components/doodles";
import { Titulo } from "@components/Titulo";

// Estado VAZIO: "nada aqui ainda, e esta tudo certo". Nao confundir com o
// BlocoBloqueio ("voce nao consegue usar esta tela, e este e o passo que
// destrava") — vazio e calmo, bloqueio e acento. Por isso aqui e `surface`,
// sem cor de acento no cartao e SEM ACAO dentro dele.
//
// A acao, quando existe, mora FORA — como o "Adicionar cliente" da tela da
// fila, que fica abaixo da lista. Botao dentro do vazio transforma "esta tudo
// certo" em "voce precisa fazer algo".
//
// A ILUSTRACAO e o que este componente acrescenta ao bloco de texto que ja
// existia. Ela entra so onde o vazio e um estado NORMAL em que o usuario pode
// ficar (fila sem ninguem, nada marcado, busca sem resultado). Onde o vazio e
// passageiro ou e erro, continua o texto solto: desenho em toda tela vazia
// vira ruido e para de significar.
//
// Centralizado, ao contrario do bloco so-de-texto: com um desenho de 132 num
// cartao de ~318 de largura, alinhar a esquerda deixa um vao a direita que
// parece defeito.
type Props = {
  doodle: DoodleName;
  titulo: string;
  texto: string;
  /** Espacamento externo — o cartao nao decide onde ele mora na tela. */
  className?: string;
};

export function EstadoVazio({ doodle, titulo, texto, className = "" }: Props) {
  return (
    <View className={`bg-vupth-surface rounded-card p-5 gap-1.5 items-center ${className}`}>
      <Doodle name={doodle} size={132} />
      <Titulo nivel={2}>{titulo}</Titulo>
      <Text className="font-body text-sm leading-5 text-vupth-textSecondary text-center">
        {texto}
      </Text>
    </View>
  );
}
