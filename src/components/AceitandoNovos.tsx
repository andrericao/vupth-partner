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

export function AceitandoNovos({ aceitando, onToggle }: Props) {
  const { interruptor } = useTema();
  return (
    <View className="flex-row items-center gap-3 mt-4 bg-vupth-surface rounded-card px-4 py-3">
      <View className="flex-1">
        <Text className="font-heading text-sm text-vupth-textPrimary">
          Aceitando novos
        </Text>
        <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">
          {aceitando
            ? "Entrada na fila liberada"
            : "Fila fechada — só quem já está espera"}
        </Text>
      </View>
      <Switch
        testID="aceitando-novos"
        value={aceitando}
        onValueChange={onToggle}
        accessibilityLabel="Aceitando novos clientes"
        {...interruptor}
      />
    </View>
  );
}
