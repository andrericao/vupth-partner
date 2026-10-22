import { View, Text, Switch } from "react-native";
import { useTema } from "@hooks/useTema";

// DS3 (c) — "aceitando novos clientes".
//
// Nao e um estado MEU (isso e a pilula), e uma propriedade da FILA. Fica FIXA
// acima dos cards de atendimento (aceitando-novos-fixo, Andre 15/10): no pe da
// lista ela descia a cada card acrescentado.
//
// A forma (linha em `surface`, titulo + legenda + chave) vem do unico lugar do
// arquivo de design onde isso foi desenhado: o quadro "ANTIGO · Partner Hoje",
// marcado como referencia abandonada. Aproveitamos a LINHA; o switch de "Loja
// aberta" que vinha ao lado dela nao existe mais — desde 2026-07-24 a loja e
// derivada do status de quem trabalha nela, ninguem abre na mao.
type Props = {
  aceitando: boolean;
  onToggle: () => void;
};

// botoes-no-topo-da-fila (Andre, 22/10): a chave sobe para o topo da Fila; desde
// o fila-cabecalho-corrigido (22/10) fica logo abaixo do titulo "Lista de Espera". Sem espaco para a legenda, ela vira dica de
// acessibilidade (o que acontece com quem ja esta na fila continua dito).
export function AceitandoNovos({ aceitando, onToggle }: Props) {
  const { interruptor } = useTema();
  return (
    <View className="flex-row items-center gap-2 self-start">
      <Text className="font-heading text-xs text-vupth-textPrimary">Aceitando novos</Text>
      <Switch
        testID="aceitando-novos"
        value={aceitando}
        onValueChange={onToggle}
        accessibilityLabel="Aceitando novos clientes"
        accessibilityHint={aceitando ? LEGENDA_ABERTA : LEGENDA_FECHADA}
        {...interruptor}
      />
    </View>
  );
}

export const LEGENDA_ABERTA = "Entrada na fila liberada";
export const LEGENDA_FECHADA = "Fila fechada — só quem já está espera";
