import { View, Text, Pressable } from "react-native";

export type Modo = "QUEUE" | "AGENDA_ONLY";

type Props = {
  atual: Modo;
  onEscolher: (modo: Modo) => void;
  ocupado?: boolean;
};

const OPCOES: { valor: Modo; titulo: string; descricao: string }[] = [
  {
    valor: "QUEUE",
    titulo: "Fila e agenda",
    descricao: "O cliente entra na fila na hora ou agenda um horário.",
  },
  {
    valor: "AGENDA_ONLY",
    titulo: "Só agenda",
    descricao: "Ninguém entra na fila na hora — o cliente só agenda.",
  },
];

// Como o profissional atende hoje (D9; contrato 8e6c00f). Andre, 26/09: decidir
// ANTES de atender, no proprio menu da fila. O backend so aceita a troca antes
// do 1o cliente da fila do dia.
export function ModoDeFuncionamento({ atual, onEscolher, ocupado = false }: Props) {
  return (
    <View className="gap-2">
      <Text className="font-heading text-base text-vupth-textPrimary">Funcionamento</Text>
      <Text className="font-body text-xs text-vupth-textSecondary">
        Escolha antes de começar a atender — depois do primeiro cliente da fila de hoje não muda mais.
      </Text>
      {OPCOES.map((o) => {
        const escolhido = atual === o.valor;
        return (
          <Pressable
            key={o.valor}
            onPress={() => !escolhido && !ocupado && onEscolher(o.valor)}
            accessibilityRole="radio"
            accessibilityState={{ checked: escolhido, disabled: ocupado }}
            accessibilityLabel={o.titulo}
            testID={`modo-${o.valor}`}
            className={`p-4 rounded-card border-2 active:opacity-80 ${
              escolhido ? "bg-vupth-greenTint border-vupth-onGreenTint" : "bg-vupth-surface border-transparent"
            }`}
          >
            <Text className={`font-heading text-sm ${escolhido ? "text-vupth-onGreenTint" : "text-vupth-textPrimary"}`}>{o.titulo}</Text>
            <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">{o.descricao}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
