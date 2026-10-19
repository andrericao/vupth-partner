import { View, Text, Switch } from "react-native";

type Props = {
  rotulo: string;
  descricao: string;
  ligado: boolean;
  onMudar: (valor: boolean) => void;
  /** Trava o interruptor enquanto a mudanca salva. */
  desabilitado?: boolean;
  testID?: string;
};

// Preferencia liga/desliga: rotulo e explicacao a esquerda, interruptor a
// direita. As MESMAS cores do interruptor do horario da loja (HorarioSemana):
// trilho verde da marca ligado, borda desligado, bolinha branca.
export function LinhaComInterruptor({ rotulo, descricao, ligado, onMudar, desabilitado = false, testID }: Props) {
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
        testID={testID}
        value={ligado}
        onValueChange={onMudar}
        disabled={desabilitado}
        trackColor={{ false: "#D7DDD3", true: "#9FE870" }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#D7DDD3"
      />
    </View>
  );
}
