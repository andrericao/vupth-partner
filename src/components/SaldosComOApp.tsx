import { View, Text } from "react-native";

import { SecaoRecolhivel } from "@components/SecaoRecolhivel";
import { formatarReais } from "@lib/dinheiro";
import { FLAG_COM_DESCONTO, linhasDoCalculo, saldosDoRelatorio } from "@lib/bonificacao";
import { horaDoCorte } from "@lib/pendenciasDoRelatorio";
import type { ProfessionalReport } from "@store/professional.store";

/**
 * recebi-mostra-cliente-e-app (DEC-127; Andre, 29/10): no Relatorio, os dois saldos compensados do
 * periodo — "a receber" (o app lhe deve) e "a pagar" (ele deve ao app) — e o liquido; abaixo, o
 * calculo de cada corte com desconto (flag PAGAMENTO COM DESCONTO), que tem de bater.
 */
export function SaldosComOApp({ report }: { report: ProfessionalReport | null | undefined }) {
  const saldos = saldosDoRelatorio(report);
  const cortes = (report?.cuts ?? []).filter((c) => c.breakdown?.discounted);
  if (!saldos && cortes.length === 0) return null;

  return (
    <SecaoRecolhivel testID="saldos-secao" titulo="Saldo com o app">
      {saldos && (
        <View testID="saldos-totais" className="gap-1">
          <Linha rotulo="A receber do app" valor={formatarReais(saldos.aReceber)} testID="saldo-a-receber" />
          <Linha rotulo="A pagar ao app" valor={formatarReais(saldos.aPagar)} testID="saldo-a-pagar" />
          <Linha rotulo="Saldo" valor={formatarReais(saldos.saldo)} testID="saldo-liquido" forte />
        </View>
      )}
      {cortes.length > 0 && (
        <View testID="saldos-calculos" className="mt-3 gap-3">
          {cortes.map((c) => (
            <View key={c.attendance_id} testID="saldos-calculo" className="gap-0.5">
              <Text className="font-heading text-f11 text-vupth-textSecondary">
                {FLAG_COM_DESCONTO}
                {horaDoCorte(c) !== "" ? ` · ${horaDoCorte(c)}` : ""}
              </Text>
              {linhasDoCalculo(c.breakdown).map((l) => (
                <Linha key={l.rotulo} rotulo={l.rotulo} valor={l.valor} />
              ))}
            </View>
          ))}
        </View>
      )}
    </SecaoRecolhivel>
  );
}

function Linha({ rotulo, valor, testID, forte = false }: { rotulo: string; valor: string; testID?: string; forte?: boolean }) {
  return (
    <View className="flex-row justify-between">
      <Text className={`font-body text-sm ${forte ? "text-vupth-textPrimary" : "text-vupth-textSecondary"}`}>{rotulo}</Text>
      <Text testID={testID} className="font-mono text-sm text-vupth-textPrimary">
        {valor}
      </Text>
    </View>
  );
}
