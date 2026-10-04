import { View, Text, Switch } from "react-native";

type Props = {
  expor: boolean;
  onMudar: (expor: boolean) => void;
  ocupado?: boolean;
};

// expor-posicao (decisao de 05/09; contrato do Backend 35d57c0): o cliente ve a
// posicao dele na fila deste profissional. O padrao e mostrar; esconder e a
// escolha ativa. Fica no menu da fila, junto do Funcionamento.
export function ExporPosicao({ expor, onMudar, ocupado = false }: Props) {
  return (
    <View className="flex-row items-center gap-3 p-4 rounded-card bg-vupth-surface">
      <View className="flex-1">
        <Text className="font-heading text-sm text-vupth-forest">Mostrar a posição na fila</Text>
        <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">
          {expor
            ? "O cliente vê a posição dele na fila."
            : "O cliente não vê a posição — só a previsão de quando será chamado."}
        </Text>
      </View>
      <Switch
        testID="expor-posicao"
        accessibilityLabel="Mostrar a posição na fila"
        value={expor}
        onValueChange={onMudar}
        disabled={ocupado}
        trackColor={{ false: "#C9CBC9", true: "#163300" }}
      />
    </View>
  );
}
