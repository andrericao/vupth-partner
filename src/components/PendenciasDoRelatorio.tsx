import { View, Text } from "react-native";

import { SecaoRecolhivel } from "@components/SecaoRecolhivel";
import { formatarReais } from "@lib/dinheiro";
import { resumoDePendencias, linhaDoCorte, horaDoCorte } from "@lib/pendenciasDoRelatorio";
import type { ProfessionalReport } from "@store/professional.store";

// relatorio-com-pendencias: "Recebe, taxas e dívida", recolhido como as outras
// secoes de Relatorios. Total do periodo e, por corte, o que recebeu, as taxas
// e a divida. Sem multa nem lucro do app (DEC-94).
export function PendenciasDoRelatorio({ report }: { report: ProfessionalReport | null | undefined }) {
  const r = resumoDePendencias(report);
  if (!r) return null;
  const cortes = (report?.cuts ?? []).filter((c) => linhaDoCorte(c) !== "");

  return (
    <SecaoRecolhivel testID="pendencias-secao" titulo="Recebe, taxas e dívida">
      <View testID="pendencias-totais" className="gap-1">
        {r.recebe !== null && <Linha rotulo="Você recebe" valor={formatarReais(r.recebe)} />}
        {r.taxas !== null && <Linha rotulo="Taxas" valor={formatarReais(r.taxas)} />}
        {r.divida > 0 ? (
          <Linha rotulo="Dívida por fora" valor={formatarReais(r.divida)} testID="pendencias-divida" />
        ) : r.simulada > 0 ? (
          <Linha rotulo="Dívida (teste)" valor={formatarReais(r.simulada)} testID="pendencias-divida-teste" />
        ) : null}
      </View>
      {cortes.length > 0 && (
        <View testID="pendencias-cortes" className="mt-3 gap-2">
          {cortes.map((c) => (
            <View key={c.attendance_id} testID="pendencias-corte">
              {horaDoCorte(c) !== "" && (
                <Text className="font-body text-f11 text-vupth-textSecondary">{horaDoCorte(c)}</Text>
              )}
              <Text className="font-body text-xs text-vupth-textPrimary">{linhaDoCorte(c)}</Text>
            </View>
          ))}
        </View>
      )}
    </SecaoRecolhivel>
  );
}

function Linha({ rotulo, valor, testID }: { rotulo: string; valor: string; testID?: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="font-body text-sm text-vupth-textSecondary">{rotulo}</Text>
      <Text testID={testID} className="font-mono text-sm text-vupth-textPrimary">
        {valor}
      </Text>
    </View>
  );
}
