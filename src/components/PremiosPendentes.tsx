import { View, Text, Pressable } from "react-native";
import { linhaDoPremio, type PremioDeIndicacao } from "@lib/premios";

// premio-em-pendentes (Andre, 05/11): os premios de indicacao ainda nao recebidos, em
// Seu dia → Pendentes, abaixo dos pagamentos dos clientes. Com `onAbrir`, tocar na
// linha abre o atendimento que gerou o premio (attendance_id).
type Props = {
  itens: PremioDeIndicacao[];
  onAbrir?: (attendanceId: string) => void;
};

export function PremiosPendentes({ itens, onAbrir }: Props) {
  if (itens.length === 0) return null;
  return (
    <View testID="premios-pendentes" className="mt-6 gap-2">
      <Text className="font-body text-f11 font-bold tracking-wider text-vupth-textSecondary">PRÊMIOS DE INDICAÇÃO</Text>
      {itens.map((p) => {
        const l = linhaDoPremio(p);
        const conteudo = (
          <View className="bg-vupth-surface rounded-card px-4 py-3 flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="font-heading text-sm text-vupth-textPrimary">{l.titulo}</Text>
              {l.detalhe ? (
                <Text testID={`premio-detalhe-${p.credit_id}`} className="font-body text-xs text-vupth-textSecondary mt-0.5">
                  {l.detalhe}
                </Text>
              ) : null}
            </View>
            <View className="items-end">
              <Text testID={`premio-valor-${p.credit_id}`} className="font-heading text-sm text-vupth-textPrimary">
                {l.valor}
              </Text>
              <Text testID={`premio-estado-${p.credit_id}`} className="font-body text-xs text-vupth-textSecondary">
                {l.estado}
              </Text>
            </View>
          </View>
        );
        const id = p.attendance_id;
        if (!onAbrir || !id) {
          return (
            <View key={p.credit_id} testID="premio-pendente">
              {conteudo}
            </View>
          );
        }
        return (
          <Pressable
            key={p.credit_id}
            testID="premio-pendente"
            accessibilityRole="button"
            accessibilityLabel={`${l.titulo}, ${l.valor} ${l.estado}. Abrir o atendimento`}
            onPress={() => onAbrir(id)}
            className="active:opacity-80"
          >
            {conteudo}
          </Pressable>
        );
      })}
    </View>
  );
}
