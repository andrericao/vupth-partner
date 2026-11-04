import { View, Text } from "react-native";

import { SecaoRecolhivel } from "@components/SecaoRecolhivel";
import { formatarReais } from "@lib/dinheiro";
import { corteTemConteudo, linhasDaComposicao, marcaDoPagamento, temComposicao } from "@lib/composicaoDoCorte";
import { horaDoCorte } from "@lib/pendenciasDoRelatorio";
import type { ProfessionalReport } from "@store/professional.store";

/**
 * relatorio-explica-valores-tela (PAR-9, DEC-166): no Relatorio do profissional, cada corte com a
 * composicao do que o cliente pagou. Taxas riscadas ("Nao cobrada no teste") enquanto o gateway nao
 * esta ligado; a multa diz para quem vai. Sem composicao no periodo, a secao nem aparece.
 */
export function ComposicaoDosCortes({ report }: { report: ProfessionalReport | null | undefined }) {
  const cortes = report?.cuts ?? [];
  if (!temComposicao(cortes)) return null;

  return (
    <SecaoRecolhivel testID="composicao-dos-cortes-secao" titulo="Para onde vai cada valor">
      <View className="gap-3">
        {cortes
          .filter(corteTemConteudo)
          .map((c) => (
            <View key={c.attendance_id} testID="composicao-do-corte" className="gap-0.5">
              {horaDoCorte(c) !== "" && (
                <Text className="font-heading text-f11 text-vupth-textSecondary">{horaDoCorte(c)}</Text>
              )}
              {marcaDoPagamento(c) && (
                <Text
                  testID={marcaDoPagamento(c)!.contestado ? "corte-contestado" : "corte-declarado"}
                  className="font-body text-xs text-vupth-textSecondary"
                >
                  {marcaDoPagamento(c)!.texto}
                </Text>
              )}
              {linhasDaComposicao(c.composition).map((l) => (
                <View key={l.chave} className="mt-0.5">
                  <View className="flex-row justify-between">
                    <Text className={`font-body text-sm ${l.forte ? "text-vupth-textPrimary" : "text-vupth-textSecondary"}`}>
                      {l.rotulo}
                    </Text>
                    <Text
                      testID={`composicao-${l.chave}`}
                      className="font-mono text-sm text-vupth-textPrimary"
                      style={l.riscada ? { textDecorationLine: "line-through" } : undefined}
                    >
                      {formatarReais(l.valor)}
                    </Text>
                  </View>
                  {l.nota && <Text className="font-body text-xs text-vupth-textSecondary">{l.nota}</Text>}
                </View>
              ))}
            </View>
          ))}
      </View>
    </SecaoRecolhivel>
  );
}
