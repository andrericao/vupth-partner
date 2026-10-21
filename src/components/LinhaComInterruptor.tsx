import { View, Text, Switch } from "react-native";
import { useTema } from "@hooks/useTema";

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
// trilho verde da marca ligado, borda desligado, bolinha branca — as props vem
// de `useTema().interruptor`, porque o `Switch` nao resolve classe e a borda
// muda de tema (interruptores.test.ts trava que nenhum outro trilho entra).
export function LinhaComInterruptor({ rotulo, descricao, ligado, onMudar, desabilitado = false, testID }: Props) {
  const { interruptor } = useTema();
  return (
    <View className="flex-row items-center gap-3 bg-vupth-surface p-4 rounded-card">
      <View className="flex-1">
        <Text className="font-body text-sm font-semibold text-vupth-textPrimary">{rotulo}</Text>
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
        {...interruptor}
      />
    </View>
  );
}
