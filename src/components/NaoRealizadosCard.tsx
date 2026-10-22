import { View, Text } from "react-native";
import { SecaoRecolhivel } from "@components/SecaoRecolhivel";
import { MOTIVOS_DO_NAO_REALIZADO, type NaoRealizados } from "@lib/relatorioDasLojas";

// relatorio-sem-multa (DEC-83): o profissional e a loja ficam com o REGISTRO do
// que nao aconteceu e o motivo — nunca o valor da multa (e do app). O mesmo
// bloco serve ao relatorio do profissional, da loja e das lojas juntas.
export function NaoRealizadosCard({
  naoRealizados,
  concluidosComAtraso,
}: {
  naoRealizados?: NaoRealizados | null;
  concluidosComAtraso?: number | null;
}) {
  const total = naoRealizados
    ? MOTIVOS_DO_NAO_REALIZADO.reduce((n, m) => n + (naoRealizados[m.campo] ?? 0), 0)
    : 0;
  const atraso = concluidosComAtraso ?? 0;
  if (total === 0 && atraso === 0) return null;

  return (
    <SecaoRecolhivel testID="nao-realizados-por-motivo" titulo="Não realizados">
      {total > 0 && naoRealizados && (
        <View className="gap-1">
          {MOTIVOS_DO_NAO_REALIZADO.map((m) => (
            <View key={m.campo} className="flex-row justify-between">
              <Text className="font-body text-xs text-vupth-textSecondary">{m.rotulo}</Text>
              <Text className="font-body text-xs text-vupth-textSecondary">{naoRealizados[m.campo] ?? 0}</Text>
            </View>
          ))}
        </View>
      )}
      {atraso > 0 && (
        <Text className="font-body text-xs text-vupth-textSecondary mt-1">
          {atraso} concluídos com atraso do cliente
        </Text>
      )}
    </SecaoRecolhivel>
  );
}
