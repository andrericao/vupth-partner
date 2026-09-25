import { View, Text, Switch } from "react-native";

type Props = {
  rotulo: string;
  descricao: string;
  ligado: boolean;
  onMudar: (valor: boolean) => void;
};

// Preferencia liga/desliga: rotulo e explicacao a esquerda, interruptor a
// direita. Trilho verde da marca quando ligado, borda quando desligado; bolinha
// forest/branca. Primeira aparicao de um interruptor no app (25/09) — cores
// avisadas ao Design.
export function LinhaComInterruptor({ rotulo, descricao, ligado, onMudar }: Props) {
  return (
    <View className="flex-row items-center gap-3 bg-vupth-surface p-4 rounded-card">
      <View className="flex-1">
        <Text className="font-body text-sm font-semibold text-vupth-forest">{rotulo}</Text>
        {!!descricao && (
          <Text className="font-body text-xs text-vupth-textSecondary mt-1">{descricao}</Text>
        )}
      </View>
      <Switch
        accessibilityRole="switch"
        accessibilityLabel={rotulo}
        value={ligado}
        onValueChange={onMudar}
        trackColor={{ false: "#D7DDD3", true: "#9FE870" }}
        thumbColor={ligado ? "#163300" : "#FFFFFF"}
        ios_backgroundColor="#D7DDD3"
      />
    </View>
  );
}
