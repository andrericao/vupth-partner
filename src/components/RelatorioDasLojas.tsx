import { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "@react-navigation/native";
import { api, getApiErrorMessage } from "@lib/api";
import { StatCard } from "@components/brand/StatCard";
import { useEstablishmentStore } from "@store/establishment.store";
import {
  PERIODOS_DAS_LOJAS,
  caminhoDoRelatorio,
  diaMes,
  intervaloDasLojas,
  reais,
  type PeriodoDasLojas,
  type RelatorioDasLojas as DadosDasLojas,
} from "@lib/relatorioDasLojas";

// multi-loja-do-dono: o relatorio do dono com as lojas juntas e cada uma. So
// aparece com mais de uma loja. A soma das linhas por dia fecha com o total.
function Chip({ label, ativo, onPress }: { label: string; ativo: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`py-2 px-4 rounded-full shrink-0 ${ativo ? "bg-vupth-forest" : "bg-vupth-surface"}`}
    >
      <Text
        numberOfLines={1}
        className={`font-body text-sm text-center ${ativo ? "text-vupth-green" : "text-vupth-textSecondary"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function RelatorioDasLojas() {
  const lojas = useEstablishmentStore((s) => s.lojas);
  const [lojaId, setLojaId] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoDasLojas>("7dias");
  const [custom, setCustom] = useState({ de: "", ate: "" });
  const focado = useIsFocused();

  const intervalo = intervaloDasLojas(periodo, custom);
  const q = useQuery({
    queryKey: ["relatorio", "dono-lojas", lojaId, intervalo?.dateFrom, intervalo?.dateTo],
    queryFn: async () =>
      (await api.get<DadosDasLojas>(caminhoDoRelatorio(intervalo!.dateFrom, intervalo!.dateTo, lojaId)))
        .data,
    enabled: focado && !!intervalo,
  });

  const r = q.data;
  const t = r?.total;
  const erro = q.error && !r ? getApiErrorMessage(q.error, "Não foi possível carregar o relatório.") : null;

  return (
    <View className="mt-6" testID="relatorio-das-lojas">
      <Text className="font-heading text-vupth-textSecondary mb-2">Todas as lojas</Text>

      <View className="flex-row flex-wrap gap-2">
        <Chip label="Todas" ativo={lojaId === null} onPress={() => setLojaId(null)} />
        {lojas.map((l) => (
          <Chip key={l.id} label={l.name} ativo={lojaId === l.id} onPress={() => setLojaId(l.id)} />
        ))}
      </View>

      <View className="flex-row flex-wrap gap-2 mt-3">
        {PERIODOS_DAS_LOJAS.map((p) => (
          <Chip key={p.key} label={p.label} ativo={periodo === p.key} onPress={() => setPeriodo(p.key)} />
        ))}
      </View>

      {periodo === "custom" && (
        <View className="flex-row gap-3 mt-3">
          {(["de", "ate"] as const).map((campo) => (
            <TextInput
              key={campo}
              value={custom[campo]}
              onChangeText={(v) => setCustom((c) => ({ ...c, [campo]: v }))}
              placeholder={campo === "de" ? "De dd/mm/aaaa" : "Até dd/mm/aaaa"}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              accessibilityLabel={campo === "de" ? "Data inicial" : "Data final"}
              className="flex-1 bg-vupth-surface rounded-card px-4 py-3 font-body text-sm text-vupth-forest"
            />
          ))}
        </View>
      )}
      {periodo === "custom" && !intervalo && (
        <Text className="font-body text-xs text-vupth-textSecondary mt-2">
          Digite as duas datas, a inicial antes da final.
        </Text>
      )}

      {erro && (
        <View className="bg-vupth-surface p-4 rounded-card mt-4">
          <Text className="font-body text-vupth-danger text-center">{erro}</Text>
        </View>
      )}

      {t && (
        <>
          <View className="flex-row gap-4 mt-4">
            <StatCard flex={1} label="Receita" value={reais(t.gross_revenue)} hero />
            <StatCard flex={1} label="Concluídos" value={String(t.finished)} />
          </View>
          <View className="flex-row gap-4 mt-3">
            <StatCard flex={1} label="Profissionais recebem" value={reais(t.professionals_net)} />
            <StatCard flex={1} label="Cancelados" value={String(t.cancelled)} />
          </View>
          {t.penalties != null && Number(t.penalties) > 0 && (
            <View className="flex-row gap-4 mt-3">
              <StatCard flex={1} label="Multas" value={reais(t.penalties)} />
              <StatCard flex={1} label="Taxas" value={reais(Number(t.gateway_fee) + Number(t.app_fee))} />
            </View>
          )}

          {lojaId === null && (r?.stores.length ?? 0) > 0 && (
            <>
              <Text className="font-heading text-vupth-textSecondary mt-6 mb-2">Por loja</Text>
              <View className="gap-2">
                {r!.stores.map((l) => (
                  <View key={l.id} className="bg-vupth-surface p-4 rounded-card flex-row justify-between">
                    <View className="flex-1">
                      <Text className="font-heading text-vupth-forest">{l.name}</Text>
                      <Text className="font-body text-xs text-vupth-textSecondary">
                        {l.summary.finished} concluídos · {l.summary.cancelled} cancelados
                      </Text>
                    </View>
                    <Text className="font-heading text-vupth-forest">{reais(l.summary.gross_revenue)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {(r?.series.length ?? 0) > 0 && (
            <>
              <Text className="font-heading text-vupth-textSecondary mt-6 mb-2">Por período</Text>
              <View className="gap-2">
                {r!.series.map((p) => (
                  <View key={p.from} className="bg-vupth-surface p-3 rounded-card flex-row justify-between">
                    <Text className="font-body text-sm text-vupth-forest">{diaMes(p.from)}</Text>
                    <Text className="font-body text-xs text-vupth-textSecondary">
                      {p.summary.finished} concluídos
                    </Text>
                    <Text className="font-heading text-vupth-forest">{reais(p.summary.gross_revenue)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
}
