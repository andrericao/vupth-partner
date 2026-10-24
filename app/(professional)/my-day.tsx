import { useState, useCallback, useEffect } from "react";
import { useVoltarAoTopo, usePilulaTopo } from "@hooks/useVoltarAoTopo";
import { PilulaVoltarAoTopo } from "@components/PilulaVoltarAoTopo";
import { useIsFocused } from "@react-navigation/native";
import {
  Alert,
  RefreshControl,
  View,
  Text,
  Pressable,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { SkeletonList } from "@components/Skeleton";
import { ExpedienteCard } from "@components/ExpedienteCard";
import { QuantoCobrarCard } from "@components/QuantoCobrarCard";
import { PendenciasDoRelatorio } from "@components/PendenciasDoRelatorio";
import { PagamentosPendentes } from "@components/PagamentosPendentes";
import { LinhaDoPagamento } from "@components/LinhaDoPagamento";
import { usePagamentosPendentes } from "@hooks/usePagamentosPendentes";
import { confirmarRecebimento, formatarReais, perguntarForma } from "@lib/pagamento";
import { confirmar } from "@lib/confirmar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { buscarGateway, CHAVE_GATEWAY } from "@lib/gateway";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { useAttendanceStore } from "@store/attendance.store";
import { useProfessionalStore } from "@store/professional.store";
import { useRelatorioDoPeriodo, type Periodo } from "@hooks/useRelatorioDoPeriodo";
import type { AttendanceHistoryItem } from "@lib/types";
import { getApiErrorMessage } from "@lib/api";
import { NaoRealizadosCard } from "@components/NaoRealizadosCard";
import { SecaoRecolhivel } from "@components/SecaoRecolhivel";
import { seloDoStatus, observacaoDoAtendimento } from "@lib/statusAtendimento";
import {
  composicaoDoAtendimento,
  somaDasContas,
  servicosComPrecoAntigo,
  avisoDoPrecoAntigo,
  type Composicao,
} from "@lib/composicao";
import { paramsDoHistorico, rotuloDoFiltroSemStatus, pertoDoFim } from "@lib/historicoDoPeriodo";

// "MEU DIA" (2026-07-22) — unifica as antigas telas Relatorios + Atendimentos,
// como no mockup do menu ("atendidos, faturado, historico" num item so).
// - O seletor de PERIODO (Hoje/Semana/Mes) governa o RESUMO (GET
//   /professional/me/reports?dateFrom&dateTo).
// - O HISTORICO segue o MESMO periodo (desde 25/09: o GET /attendances aceita
//   dateFrom/dateTo, e sem datas ele trazia a vida inteira a cada foco) e tem
//   os proprios filtros de STATUS.
type Period = Periodo;
type Filter = "ALL" | "FINISHED" | "CANCELLED" | "REMOVED";


function humanizeService(value: string | null): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Uma linha da composicao: rotulo a esquerda, valor a direita. */
function LinhaDaConta({ rotulo, valor, forte = false }: { rotulo: string; valor: number; forte?: boolean }) {
  return (
    <View className="flex-row justify-between mt-1">
      <Text className={`font-body text-xs ${forte ? "text-vupth-textPrimary font-semibold" : "text-vupth-textSecondary"}`}>
        {rotulo}
      </Text>
      <Text className={`font-body text-xs ${forte ? "text-vupth-textPrimary font-semibold" : "text-vupth-textSecondary"}`}>
        {formatarReais(valor)}
      </Text>
    </View>
  );
}

/**
 * relatorio-todas-as-linhas (DEC-55): todas as parcelas, e a soma fecha no
 * "Cliente pagou". Serve ao atendimento e ao total do periodo.
 */
function ContaDoAtendimento({ conta, testID = "composicao-do-atendimento" }: { conta: Composicao; testID?: string }) {
  return (
    <View testID={testID} className="mt-3 pt-2 border-t border-vupth-border">
      <LinhaDaConta rotulo="Você recebe" valor={conta.voceRecebeu} forte />
      <LinhaDaConta rotulo="Empresa de pagamento" valor={conta.empresaDePagamento} />
      <LinhaDaConta rotulo="App Vupth (2%)" valor={conta.app} />
      <LinhaDaConta rotulo="Arredondamento" valor={conta.arredondamento} />
      <LinhaDaConta rotulo="Outros ajustes" valor={conta.outros} />
      <LinhaDaConta rotulo="Cliente pagou" valor={conta.clientePagou} forte />
      {conta.estimados.length > 0 && (
        <Text className="font-body text-xs text-vupth-textSecondary mt-1">
          {`Estimado: ${conta.estimados.join(", ")} com preço antigo ou apagado.`}
        </Text>
      )}
    </View>
  );
}

function AttendanceHistoryCard({ item, conta }: { item: AttendanceHistoryItem; conta: Composicao }) {
  const [aberto, setAberto] = useState(false);
  // Rotulo e cor vem da lib compartilhada com Atendimentos do dono —
  // inclusive o REMOVED (a loja retirou), que antes cairia cru na tela.
  const statusInfo = seloDoStatus(item.status);
  const date = new Date(item.scheduledTime);
  const dateStr = `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <Pressable
      onPress={() => setAberto((a) => !a)}
      accessibilityRole="button"
      accessibilityState={{ expanded: aberto }}
      accessibilityLabel={`Atendimento de ${item.clientName}: ver a conta`}
      testID="historico-atendimento"
      className="bg-vupth-surface p-4 rounded-card mb-3 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-heading text-vupth-textPrimary">{item.clientName}</Text>
        <View className={`px-3 py-1 rounded-md ${statusInfo.selo}`}>
          <Text className={`font-body text-xs ${statusInfo.texto}`}>{statusInfo.label}</Text>
        </View>
      </View>

      <Text className="font-body text-xs text-vupth-textSecondary mt-1">
        {dateStr}
        {item.durationInMinutes != null && ` — ${item.durationInMinutes}min`}
      </Text>

      {observacaoDoAtendimento(item) && (
        <Text testID="observacao-do-atendimento" className="font-body text-xs text-vupth-textSecondary mt-1">
          {observacaoDoAtendimento(item)}
        </Text>
      )}

      <Text className="font-body text-sm text-vupth-textSecondary mt-1">
        {item.services.map((s) => s.customName).join(", ")}
      </Text>

      <View className="flex-row items-center justify-between mt-2">
        <Text className="font-body text-xs text-vupth-textSecondary">{aberto ? "Esconder a conta" : "Ver a conta"}</Text>
        <Text className="font-heading text-vupth-textPrimary">{formatarReais(item.totalValue)}</Text>
      </View>
      <LinhaDoPagamento status={item.payment_status} />
      {aberto && <ContaDoAtendimento conta={conta} />}
    </Pressable>
  );
}

/** Chip de escolha (periodo e filtro). Escolhido: forest com texto verde. */
function Chip({ label, ativo, onPress }: { label: string; ativo: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      className={`py-2 px-4 rounded-full active:opacity-70 ${ativo ? "bg-vupth-selecionado" : "bg-vupth-surface"}`}
    >
      <Text
        numberOfLines={1}
        className={`font-body text-sm text-center ${ativo ? "text-vupth-onSelecionado" : "text-vupth-textSecondary"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Card de numero do resumo. `destaque` = o card-heroi (receita). */
function Numero({
  rotulo,
  valor,
  tamanho = "text-xxl",
  destaque = false,
}: {
  rotulo: string;
  valor: string | number;
  tamanho?: string;
  destaque?: boolean;
}) {
  return (
    <View className={`flex-1 p-4 rounded-card ${destaque ? "bg-vupth-green" : "bg-vupth-surface"}`}>
      <Text className={`font-body text-sm ${destaque ? "text-vupth-onGreen" : "text-vupth-textSecondary"}`}>
        {rotulo}
      </Text>
      <Text className={`font-heading ${tamanho} ${destaque ? "text-vupth-onGreen" : "text-vupth-textPrimary"}`}>{valor}</Text>
    </View>
  );
}

export default function MyDayScreen() {
  // Tocar na aba JA ATIVA volta ao topo (Andre, 18/09).
  const rolagemRef = useVoltarAoTopo();
  const pilula = usePilulaTopo(rolagemRef);

  const professional = useProfessionalStore((s) => s.professional);
  const queryClient = useQueryClient();
  const { itens: pagamentos } = usePagamentosPendentes(!!professional?.id);
  const { data: gateway } = useQuery({ queryKey: CHAVE_GATEWAY, queryFn: buscarGateway, staleTime: 60_000, retry: false });
  const recebi = async (attendanceId: string) => {
    const p = pagamentos.find((x) => x.attendance_id === attendanceId);
    const ok = await confirmar({
      titulo: "Recebeu o pagamento?",
      mensagem: `Confirme que ${p?.client_name ?? "o cliente"} pagou ${formatarReais(p?.amount ?? 0)}.`,
      confirmar: "Recebi",
    });
    if (!ok) return;
    const forma = await perguntarForma();
    try {
      await confirmarRecebimento(attendanceId, forma);
      await queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível confirmar o pagamento."));
    }
  };
  const isFocused = useIsFocused();
  const fetchMyReport = useProfessionalStore((s) => s.fetchMyReport);
  // explicar-o-relatorio (PAR-18): a divisao de cada atendimento vem do servico cadastrado.
  const myServices = useProfessionalStore((s) => s.myServices);
  const fetchMyServices = useProfessionalStore((s) => s.fetchMyServices);
  useEffect(() => {
    if (myServices.length === 0) fetchMyServices().catch(() => {});
    // so na montagem: a lista vazia de quem nao tem servico nao refaz o GET em laco
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const history = useAttendanceStore((s) => s.history);
  const fetchHistoryPage = useAttendanceStore((s) => s.fetchHistoryPage);
  const { data } = useQueuePolling(professional?.establishment_id ?? null);

  const [period, setPeriod] = useState<Period>("day");
  // O resumo de cada periodo fica guardado: voltar a aba pinta o numero na
  // hora e atualiza por tras (fila do partner, 25/09).
  const {
    dados: report,
    carregando: reportLoading,
    recarregar: loadReport,
  } = useRelatorioDoPeriodo("profissional", professional?.id, period, fetchMyReport);

  const [filter, setFilter] = useState<Filter>("ALL");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // historico-paginado (cefac04): 20 por vez; a proxima ao chegar perto do fim.
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);

  // relatorio-todas-as-linhas (DEC-55): os totais do topo somam as linhas do
  // historico. So quando o historico do periodo esta inteiro e inclui os
  // finalizados; senao, o resumo do backend.
  const contaDoPeriodo =
    historyLoaded && !temMais && (filter === "ALL" || filter === "FINISHED")
      ? somaDasContas(
          history
            .filter((h) => h.status === "FINISHED")
            .map((h) => composicaoDoAtendimento(h, myServices))
        )
      : null;
  const precoAntigo =
    contaDoPeriodo?.estimados ??
    (report?.attendancesWithoutSplit ? servicosComPrecoAntigo(myServices) : []);

  const myProfessional = data?.professionals?.find((p) => p.id === professional?.id);
  const queueCount = myProfessional?.queue_count ?? 0;
  const waitMinutes = myProfessional?.estimated_wait_minutes ?? 0;

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const loadHistory = useCallback(async () => {
    if (!professional?.id) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const { hasNext } = await fetchHistoryPage(paramsDoHistorico(professional.id, filter, period), 0);
      setPagina(0);
      setTemMais(hasNext);
      setHistoryLoaded(true);
    } catch (error: any) {
      setHistoryError(getApiErrorMessage(error, "Não foi possível carregar os atendimentos."));
    } finally {
      setHistoryLoading(false);
    }
  }, [professional?.id, filter, period, fetchHistoryPage]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const carregarMais = useCallback(async () => {
    if (!professional?.id || !temMais || carregandoMais || historyLoading) return;
    setCarregandoMais(true);
    try {
      const proxima = pagina + 1;
      const { hasNext } = await fetchHistoryPage(paramsDoHistorico(professional.id, filter, period), proxima);
      setPagina(proxima);
      setTemMais(hasNext);
    } catch {
      // Fica a lista que ja veio; rolar de novo tenta outra vez.
    } finally {
      setCarregandoMais(false);
    }
  }, [professional?.id, temMais, carregandoMais, historyLoading, pagina, filter, period, fetchHistoryPage]);

  const aoRolar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    pilula.onScroll(e);
    if (pertoDoFim(e.nativeEvent)) carregarMais();
  };

  // RECARREGA AO FOCAR (feedback de device 2026-08-11): "iniciei o atendimento,
  // na Fila aparecia 'atendendo agora' e aqui continuava AGENDADO". A causa e
  // que estas duas telas sao ABAS — o React Navigation nao remonta ao voltar,
  // entao o fetch on-mount rodava uma vez so e a lista envelhecia calada (o
  // "depois de um tempo atualizou" era outra remontagem). Com `isFocused` na
  // dependencia, voltar p/ Relatorios busca de novo.
  useEffect(() => {
    if (!isFocused) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, [loadHistory, isFocused]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadReport(), loadHistory()]);
    setRefreshing(false);
  }, [loadReport, loadHistory]);

  const periods: { key: Period; label: string }[] = [
    { key: "day", label: "Hoje" },
    { key: "week", label: "Semana" },
    { key: "month", label: "Mes" },
  ];

  const filters: { key: Filter; label: string }[] = [
    { key: "ALL", label: rotuloDoFiltroSemStatus(period) },
    { key: "FINISHED", label: "Finalizados" },
    { key: "CANCELLED", label: "Cancelados" },
    // A loja retirou (backend, 18/09) — separado de quem desistiu.
    { key: "REMOVED", label: "Retirados" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={rolagemRef}
        onScroll={aoRolar}
        scrollEventThrottle={64}
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="flex-1 pb-12 px-4">
          {/* [marca-vupth] Titulo do Pencil (PROF · 03) e "Seu dia" — bate com o
              conceito interno da tela ("MEU DIA", que uniu Relatórios +
              Atendimentos); "Relatórios" ficou só no rotulo da aba, mais curto
              pra caber no rodape. */}
          <ScreenHeader
            title="Seu dia"
            onBack={() => router.navigate("/(professional)/queue" as any)}
          />

          <View className="flex-row flex-wrap gap-2 mt-6">
            {periods.map((p) => (
              <Chip key={p.key} label={p.label} ativo={period === p.key} onPress={() => setPeriod(p.key)} />
            ))}
          </View>

          <ExpedienteCard periodo={period} workdays={report?.workdays} />
          <QuantoCobrarCard />

          {/* pagamento-pix (Andre, 10/10): os atendimentos com pagamento pendente
              e o "Recebi". O dot da aba some quando nao ha o que conferir. */}
          <PagamentosPendentes itens={pagamentos} onRecebi={recebi} gateway={gateway} />

          <View className="h-px bg-vupth-border my-6" />

          {period === "day" && (
            <View className="flex-row gap-3 mb-4">
              <Numero rotulo="Na fila agora" valor={queueCount} />
              <Numero rotulo="Espera estimada" valor={`${waitMinutes} min`} />
            </View>
          )}

          {reportLoading ? (
            <View className="mt-2">
              <SkeletonList count={2} />
            </View>
          ) : (
            <View className="gap-3">
              {/* [marca-vupth] Receita e o card-heroi (brandGreen, primeira
                  posição) — o Pencil (PROF · 03) da esse tratamento pro
                  faturado, o único número em dinheiro da tela. */}
              {/* Relatorio SEM os 6% (bloqueava a publicacao): o heroi e o que
                  o profissional recebeu. Backend antigo sem `netRevenue` cai no
                  total, como antes. Rotulos a validar com o Design. */}
              <View className="flex-row gap-3">
                <Numero
                  rotulo={contaDoPeriodo || report?.netRevenue != null ? "Você recebeu" : "Receita"}
                  valor={formatarReais(contaDoPeriodo?.voceRecebeu ?? report?.netRevenue ?? report?.totalRevenue ?? 0)}
                  destaque
                />
                <Numero rotulo="Atendimentos" valor={report?.totalAttendances ?? 0} />
              </View>

              <View className="flex-row gap-3">
                <Numero
                  rotulo="Duração média"
                  valor={`${Math.round(report?.avgDurationMinutes ?? 0)} min`}
                  tamanho="text-xl"
                />
                <Numero
                  rotulo="Serviço mais feito"
                  valor={humanizeService(report?.topService ?? null)}
                  tamanho="text-md"
                />
              </View>

              {contaDoPeriodo ? (
                <SecaoRecolhivel testID="conta-do-periodo-secao" titulo="A conta do período">
                  <ContaDoAtendimento conta={contaDoPeriodo} testID="conta-do-periodo" />
                </SecaoRecolhivel>
              ) : (
                report?.netRevenue != null && (
                  <Text className="font-body text-xs text-vupth-textSecondary">
                    {`Clientes pagaram ${formatarReais(Number(report?.totalRevenue ?? 0))}. A conta linha a linha está no fim do histórico.`}
                  </Text>
                )
              )}
              <PendenciasDoRelatorio report={report} />
              <NaoRealizadosCard naoRealizados={report?.notRealized} concluidosComAtraso={report?.finishedLate} />
              {avisoDoPrecoAntigo(precoAntigo) && (
                <View className="bg-vupth-warning p-3 rounded-card">
                  <Text className="font-body text-xs text-vupth-onAccentPeach">{avisoDoPrecoAntigo(precoAntigo)}</Text>
                </View>
              )}

              <Text className="font-body text-xs text-vupth-textSecondary text-center mt-2">
                {period === "day" ? "Hoje" : period === "week" ? "Últimos 7 dias" : "Últimos 30 dias"} •
                atendimentos finalizados
              </Text>
            </View>
          )}

          <View className="h-px bg-vupth-border my-6" />

          <Text className="font-heading text-xl text-vupth-textPrimary mb-3">Histórico</Text>

          <View className="flex-row flex-wrap gap-2 mb-4">
            {filters.map((f) => (
              <Chip key={f.key} label={f.label} ativo={filter === f.key} onPress={() => setFilter(f.key)} />
            ))}
          </View>

          {historyLoading && (
            <View className="mt-2">
              <SkeletonList count={3} />
            </View>
          )}

          {historyError && (
            <View className="bg-vupth-warning p-4 rounded-card mt-2">
              <Text className="font-body text-vupth-onAccentPeach text-center">{historyError}</Text>
              <Pressable onPress={loadHistory} accessibilityRole="button" className="mt-2 active:opacity-70">
                <Text className="font-body text-sm text-vupth-onAccentPeach text-center">Tentar novamente</Text>
              </Pressable>
            </View>
          )}

          {!historyLoading && historyLoaded && !historyError && history.length === 0 && (
            <Text className="font-body text-vupth-textSecondary text-center mt-6">
              {period === "day"
                ? "Nenhum atendimento hoje"
                : period === "week"
                  ? "Nenhum atendimento nos últimos 7 dias"
                  : "Nenhum atendimento nos últimos 30 dias"}
            </Text>
          )}

          {!historyLoading && historyLoaded && !historyError && history.length > 0 && (
            <View>
              {history.map((item) => (
                <AttendanceHistoryCard
                  key={item.id}
                  item={item}
                  conta={composicaoDoAtendimento(item, myServices)}
                />
              ))}
              {carregandoMais && (
                <View testID="historico-carregando-mais" className="mt-2">
                  <SkeletonList count={2} />
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      <PilulaVoltarAoTopo visivel={pilula.visivel} onPress={pilula.subir} />
    </View>
  );
}
