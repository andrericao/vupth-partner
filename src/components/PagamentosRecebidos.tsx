import { View, Text } from "react-native";
import { linhaDoPagamento, pagamentosParaMostrar, type PagamentoRecebido } from "@lib/pagamentosRecebidos";

// pago-no-relatorio (Andre, 06/11): no Historico do relatorio, o que o VUPTH ja pagou,
// com "pago em dd/mm" e a nota. Sem pagamento, nada.
export function PagamentosRecebidos({ itens }: { itens: PagamentoRecebido[] }) {
  const pagamentos = pagamentosParaMostrar(itens);
  if (pagamentos.length === 0) return null;
  return (
    <View testID="pagamentos-recebidos" className="mt-6 gap-2">
      <Text className="font-body text-f11 font-bold tracking-wider text-vupth-textSecondary">PAGOS PELO VUPTH</Text>
      {pagamentos.map((p) => {
        const l = linhaDoPagamento(p);
        return (
          <View
            key={p.id}
            testID="pagamento-recebido"
            className="bg-vupth-surface rounded-card px-4 py-3 flex-row items-center justify-between gap-3"
          >
            <View className="flex-1">
              <Text className="font-heading text-sm text-vupth-textPrimary">{l.titulo}</Text>
              {l.nota ? (
                <Text testID={`pagamento-nota-${p.id}`} className="font-body text-xs text-vupth-textSecondary mt-0.5">
                  {l.nota}
                </Text>
              ) : null}
            </View>
            <View className="items-end">
              <Text className="font-heading text-sm text-vupth-textPrimary">{l.valor}</Text>
              <Text testID={`pagamento-estado-${p.id}`} className="font-body text-xs text-vupth-textSecondary">
                {l.estado}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
