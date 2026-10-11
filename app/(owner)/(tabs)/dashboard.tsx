import { useState, useCallback, useEffect } from "react";
import { nomeDaEspecialidade } from "@lib/especialidade";
import { useVoltarAoTopo, usePilulaTopo } from "@hooks/useVoltarAoTopo";
import { PilulaVoltarAoTopo } from "@components/PilulaVoltarAoTopo";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  BackHandler,
} from "react-native";
import { ChevronRight, Moon, Pause } from "lucide-react-native";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { NwButton } from "@components/nw/Button";
import { ScreenHeader } from "@components/ScreenHeader";
import { useEstablishmentStore } from "@store/establishment.store";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { useOwnerCompletion } from "@hooks/useOwnerCompletion";
import { getApiErrorMessage, API_ENV } from "@lib/api";
import { serviceTypeLabel } from "@lib/serviceTypes";
import { ReadinessFaixa } from "@components/ReadinessFaixa";
import { AvisoLojaSemPonto } from "@components/AvisoLojaSemPonto";
import type { ProfessionalWithQueue } from "@lib/types";
import { confirmar } from "@lib/confirmar";
import { avisoDeAberturaSemProfissional } from "@lib/abertura";
import { CompartilharNoTopo } from "@components/CompartilharNoTopo";
import { linkDaLoja, mensagemDeDivulgacao } from "@lib/linkPublico";

export default function OwnerDashboardScreen() {
  // Tocar na aba JA ATIVA volta ao topo (Andre, 18/09).
  const rolagemRef = useVoltarAoTopo();
  const pilula = usePilulaTopo(rolagemRef);

  const establishment = useEstablishmentStore((s) => s.establishment);
  const updateOpenStatus = useEstablishmentStore((s) => s.updateOpenStatus);
  const fetchMine = useEstablishmentStore((s) => s.fetchMine);
  const [isToggling, setIsToggling] = useState(false);
  const isFocused = useIsFocused();

  // Completude (faixa de prontidao). Fonte unica compartilhada com o checklist
  // (Dados do Estabelecimento) e o dot (menu). Ver useOwnerCompletion.
  const { completion } = useOwnerCompletion();

  useEffect(() => {
    // SEMPRE re-sincroniza com o servidor (QA 2026-07-22): o restore do
    // SecureStore pode estar VELHO — id morto apos reset do staging, endereco/
    // horario desatualizados. Antes so buscava se a store estivesse vazia, e
    // como o boot restaura, ela NUNCA estava — o app vivia do snapshot morto
    // (era a causa do "endereco/profissional pendentes" fantasmas). Offline:
    // o catch mantem o persistido como fallback.
    fetchMine().catch(() => {});
    // carga on-mount unica; fetchMine e estavel (Zustand).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isFocused) return;
    const handler = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => handler.remove();
  }, [isFocused]);

  // loja-sem-coordenada: o PENDING do endereco vira LOCATED/UNRESOLVED em segundos.
  const relerLoja = useCallback(() => {
    fetchMine().catch(() => {});
  }, [fetchMine]);

  const status = establishment?.open_status ?? "CLOSED";
  const isOpen = status === "OPEN";
  const establishmentId = establishment?.id;

  const { data: queueData, refetch } = useQueuePolling(establishmentId ?? null);
  const totalInQueue = queueData?.total_in_queue ?? 0;
  const professionals: ProfessionalWithQueue[] = queueData?.professionals ?? [];
  // Ha cliente em atendimento ou na fila? Nesse caso o fechamento TOTAL fica
  // bloqueado (o caminho e "Fechar Temporariamente" p/ nao receber novos e
  // terminar a fila). Previne o clique; o backend ainda barra por 409.
  const hasActiveWork =
    totalInQueue > 0 || professionals.some((p) => !!p.current_attendance);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const STATUS_BADGE: Record<string, { label: string; action: "success" | "error" | "warning" }> = {
    OPEN: { label: "ABERTO", action: "success" },
    CLOSED: { label: "FECHADO", action: "error" },
    // "FECHADO TEMPORARIAMENTE" tinha 23 caracteres e espremia o nome da loja
    // em tres linhas. "PAUSADO" diz a mesma coisa e casa com a acao que leva a
    // esse estado ("Pausar entrada").
    TEMPORARILY_CLOSED: { label: "PAUSADO", action: "warning" },
  };
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.CLOSED;

  const setStatus = async (newStatus: string) => {
    if (!establishment || newStatus === status) return;

    // Abrir sem ninguem trabalhando e legitimo (a equipe ainda vai chegar), mas
    // nao pode ser mudo: o cliente veria a loja aberta e sem quem atenda.
    // Avisa e deixa seguir — decisao do Andre, 07/09. Ver src/lib/abertura.ts.
    if (newStatus === "OPEN") {
      const aviso = avisoDeAberturaSemProfissional(professionals);
      if (aviso && !(await confirmar(aviso))) return;
    }

    // A validacao de "estabelecimento pronto" (>=1 profissional com >=1 servico)
    // e feita no backend (422 ESTABLISHMENT_NOT_READY). Tentamos abrir e tratamos o erro.
    setIsToggling(true);
    try {
      await updateOpenStatus(establishment.id, newStatus);
    } catch (error: any) {
      const code = error?.response?.data?.code;
      if (code === "ESTABLISHMENT_NOT_READY") {
        confirmar({
          titulo: "Estabelecimento sem profissional pronto",
          mensagem: getApiErrorMessage(error, "Para abrir, e necessario ter pelo menos um profissional com serviço cadastrado."),
          confirmar: "Adicionar profissional",
        }).then((ok) => {
          if (ok)
            router.push({
              pathname: "/(owner)/add-professional",
              params: { establishmentId: establishment.id },
            } as any);
        });
      } else if (code === "ESTABLISHMENT_HOURS_REQUIRED") {
        confirmar({
          titulo: "Defina o horário de funcionamento",
          mensagem: getApiErrorMessage(error, "Defina o horário de funcionamento do estabelecimento antes de abrir."),
          confirmar: "Definir Horário",
        }).then((ok) => {
          if (ok) router.push("/(owner)/establishment-hours" as any);
        });
      } else if (code === "ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES") {
        Alert.alert(
          "Há atendimentos em andamento",
          getApiErrorMessage(
            error,
            "Não é possível fechar enquanto há clientes em atendimento ou na fila. Conclua a fila antes de fechar."
          )
        );
      } else {
        Alert.alert(
          "Erro",
          getApiErrorMessage(error, "Não foi possível atualizar o status. Tente novamente.")
        );
      }
    } finally {
      setIsToggling(false);
    }
  };

  if (!establishment) {
    return (
      <View className="flex-1 pb-6 px-4">
        <ScreenHeader title="Meu estabelecimento" />
        <View className="flex-1 items-center justify-center">
          <Text className="font-body text-vupth-textSecondary">
            Nenhum estabelecimento encontrado.
          </Text>
          <NwButton
            title="Criar estabelecimento"
            onPress={() => router.push("/(owner)/onboarding/establishment" as any)}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={rolagemRef}
          onScroll={pilula.onScroll}
          scrollEventThrottle={64}
        className="w-full bg-white"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="flex-1 pb-6 px-4 bg-white">
          {/* O nome da loja E o titulo desta tela, e o status a acao do canto —
              entao viram title/subtitle/action do cabecalho, em vez de um bloco
              proprio com margem propria embaixo de um Header vazio. */}
          <ScreenHeader
            title={establishment.name}
            subtitle={serviceTypeLabel(establishment.service_type)}
            action={
              <View className="flex-row items-center gap-2">
              {/* Pausado fica AMBAR: e um estado que pede acao ("reabrir"), e no
                 cinza da borda sobre fundo claro a pilula sumia. */}
              <View
                className={`rounded-full px-3 py-1.5 ${
                  isOpen
                    ? "bg-vupth-green"
                    : status === "TEMPORARILY_CLOSED"
                      ? "bg-vupth-warning"
                      : "bg-vupth-border"
                }`}
              >
                <Text
                  className={`font-display text-f11 ${
                    isOpen || status === "TEMPORARILY_CLOSED"
                      ? "text-vupth-forest"
                      : "text-vupth-textSecondary"
                  }`}
                >
                  {badge.label}
                </Text>
              </View>
              {/* compartilhar-no-topo (Andre, 05/10): o link da loja. */}
              <CompartilharNoTopo
                link={linkDaLoja(API_ENV, establishment.id)}
                titulo={establishment.name ?? "Minha loja"}
                mensagem={mensagemDeDivulgacao(establishment.name)}
                rotulo="Compartilhar a loja"
              />
              </View>
            }
          />
  
          <ReadinessFaixa
            completion={completion}
            targetRoute={`/(owner)/establishment-data?establishmentId=${establishmentId ?? ""}`}
            goalNoun="aparecer aos clientes"
          />

          <AvisoLojaSemPonto endereco={establishment.address} onReler={relerLoja} />
  
          {/* Os dois numeros que o dono abre o app pra ver. A fila e o CAMINHO
              pras filas, no lugar do botão ambar "Ver Filas" que competia com
              tudo.
  
              [marca-vupth] O verde-marca e ACENTO, não cor de "clicavel". Com a
              fila VAZIA não há destaque a dar (zero e a ausencia de fila, não o
              número que importa), entao o card fica neutro e o verde sobra pra
              única ação da tela. */}
          <View className="flex-row gap-4 mt-5">
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(owner)/queues",
                  params: { establishmentId: establishment.id },
                } as any)
              }
              className={`flex-1 p-4 rounded-card ${
                totalInQueue > 0 ? "bg-vupth-green" : "bg-vupth-surface"
              }`}
            >
              <View className="flex-row justify-between items-start">
                <Text className="font-display text-f32 text-vupth-forest">{totalInQueue}</Text>
                <ChevronRight size={18} color="#163300" />
              </View>
              <Text
                className={`font-body text-xs mt-1 ${
                  totalInQueue > 0 ? "text-vupth-forest" : "text-vupth-textSecondary"
                }`}
              >
                na fila agora
              </Text>
            </Pressable>
  
            <View className="flex-1 bg-vupth-surface p-4 rounded-card">
              <Text className="font-display text-f32 text-vupth-forest">
                {queueData?.available_professionals ?? 0}
              </Text>
              <Text className="font-body text-xs text-vupth-textSecondary mt-1">
                profissionais ativos
              </Text>
            </View>
          </View>
  
          {/* Abrir e a unica acao de PESO aqui: e o que destrava o dia. Encerrar
              e pausar viraram texto discreto — não sao erros nem perigo, sao o
              fim normal do expediente (e "fechar" em vermelho fazia parecer que
              o dono estava fechando o NEGOCIO). */}
          {!isOpen ? (
            <View className="mt-5">
              <NwButton
                title={status === "TEMPORARILY_CLOSED" ? "Reabrir agora" : "Abrir estabelecimento"}
                onPress={() => setStatus("OPEN")}
                isLoading={isToggling}
              />
            </View>
          ) : (
            <View className="mt-5 flex-row justify-between items-center">
              <Pressable
                onPress={() => {
                  if (hasActiveWork) {
                    Alert.alert(
                      "Ainda tem gente na fila",
                      "Use 'Pausar entrada' para não receber novos clientes e terminar quem já está esperando."
                    );
                    return;
                  }
                  setStatus("CLOSED");
                }}
                disabled={isToggling}
              >
                <View className="flex-row items-center gap-1">
                  <Moon size={15} color="#454745" />
                  <Text className="font-body text-sm text-vupth-textSecondary">Encerrar o dia</Text>
                </View>
              </Pressable>
  
              <Pressable onPress={() => setStatus("TEMPORARILY_CLOSED")} disabled={isToggling}>
                <View className="flex-row items-center gap-1">
                  <Pause size={15} color="#454745" />
                  <Text className="font-body text-sm text-vupth-textSecondary">Pausar entrada</Text>
                </View>
              </Pressable>
            </View>
          )}
  
          <View className="h-px bg-vupth-border my-6" />
  
          <View className="flex-row justify-between items-center mb-3">
            <Text className="font-heading text-lg text-vupth-forest">Profissionais</Text>
            <Text className="font-body text-sm text-vupth-textSecondary">
              {professionals.length} cadastrado{professionals.length !== 1 ? "s" : ""}
            </Text>
          </View>
  
          {professionals.length === 0 ? (
            // O botao vai em OUTLINE: e acao terciaria dentro de um placeholder,
            // nao pode ter o mesmo peso do "Reabrir agora" logo acima — eram duas
            // pilulas verde-marca identicas na mesma tela.
            <View className="bg-vupth-surface p-4 rounded-card items-center">
              <Text className="font-body text-vupth-textSecondary text-center">
                Nenhum profissional vinculado
              </Text>
              <NwButton
                title="Adicionar profissional"
                variant="vupthOutline"
                onPress={() =>
                  router.push({
                    pathname: "/(owner)/add-professional",
                    params: { establishmentId: establishment.id },
                  } as any)
                }
                className="mt-3 h-12 px-6 bg-vupth-background"
              />
            </View>
          ) : (
            <View className="gap-2">
              {professionals.map((prof) => (
                <Pressable
                  key={prof.id}
                  onPress={() =>
                    router.push({
                      pathname: "/(owner)/professional-queue",
                      params: {
                        professionalId: prof.id,
                        establishmentId: establishment.id,
                        professionalName: prof.name,
                      },
                    } as any)
                  }
                  className="bg-vupth-surface py-4 px-4 rounded-card"
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="font-heading text-vupth-forest">{prof.name}</Text>
                      <Text className="font-body text-xs text-vupth-textSecondary">
                        {nomeDaEspecialidade(prof.specialty) || "Sem especialidade"}
                      </Text>
                    </View>
                    <View className="items-end">
                      <View
                        className={`px-3 py-1 rounded-md ${
                          prof.queue_count > 0 ? "bg-vupth-greenTint" : "bg-white"
                        }`}
                      >
                        <Text
                          className={`font-body text-xs ${
                            prof.queue_count > 0 ? "text-vupth-forest" : "text-vupth-textSecondary"
                          }`}
                        >
                          {prof.queue_count} na fila
                        </Text>
                      </View>
                      <Text
                        className={`font-body text-xs mt-1 ${
                          prof.is_available ? "text-vupth-forest" : "text-vupth-textSecondary"
                        }`}
                      >
                        {prof.is_available ? "Disponivel" : "Indisponivel"}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <PilulaVoltarAoTopo visivel={pilula.visivel} onPress={pilula.subir} />
    </View>
  );
}
