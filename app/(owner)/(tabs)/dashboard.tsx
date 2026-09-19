import { useState, useCallback, useEffect } from "react";
import { useVoltarAoTopo } from "@hooks/useVoltarAoTopo";
import {
  VStack,
  Heading,
  Text,
  HStack,
  Badge,
  BadgeText,
  Divider,
  ScrollView,
  Pressable,
} from "@gluestack-ui/themed";
import { Alert, RefreshControl, BackHandler } from "react-native";
import { ChevronRight, Moon, Pause } from "lucide-react-native";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { BrandButton } from "@components/brand/Button";
import { ScreenHeader } from "@components/ScreenHeader";
import { useEstablishmentStore } from "@store/establishment.store";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { useOwnerCompletion } from "@hooks/useOwnerCompletion";
import { getApiErrorMessage } from "@lib/api";
import { serviceTypeLabel } from "@lib/serviceTypes";
import { ReadinessFaixa } from "@components/ReadinessFaixa";
import type { ProfessionalWithQueue } from "@lib/types";
import { confirmar } from "@lib/confirmar";
import { avisoDeAberturaSemProfissional } from "@lib/abertura";

export default function OwnerDashboardScreen() {
  // Tocar na aba JA ATIVA volta ao topo (Andre, 18/09).
  const rolagemRef = useVoltarAoTopo();

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
      <VStack flex={1} pb="$6" px="$4">
        <ScreenHeader title="Meu estabelecimento" />
        <VStack flex={1} alignItems="center" justifyContent="center">
          <Text fontFamily="$body" color="$brandTextSecondary">
            Nenhum estabelecimento encontrado.
          </Text>
          <BrandButton
            title="Criar estabelecimento"
            onPress={() => router.push("/(owner)/onboarding/establishment" as any)}
            mt="$9"
          />
        </VStack>
      </VStack>
    );
  }

  return (
    <ScrollView
        ref={rolagemRef}
      w="$full"
      bg="$brandBackground"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <VStack flex={1} pb="$6" px="$4" bg="$brandBackground">
        {/* O nome da loja E o titulo desta tela, e o status a acao do canto —
            entao viram title/subtitle/action do cabecalho, em vez de um bloco
            proprio com margem propria embaixo de um Header vazio. */}
        <ScreenHeader
          title={establishment.name}
          subtitle={serviceTypeLabel(establishment.service_type)}
          action={
            /* Pausado fica AMBAR: e um estado que pede acao ("reabrir"), e no
               `$border` cinza sobre fundo claro a pilula sumia. */
            <VStack
              bg={isOpen ? "$brandGreen" : status === "TEMPORARILY_CLOSED" ? "$brandWarning" : "$brandBorder"}
              borderRadius="$full"
              px="$3"
              py="$1.5"
            >
              <Text
                fontFamily="$display"
                fontSize={11}
                color={isOpen || status === "TEMPORARILY_CLOSED" ? "$forest" : "$brandTextSecondary"}
              >
                {badge.label}
              </Text>
            </VStack>
          }
        />

        <ReadinessFaixa
          completion={completion}
          targetRoute={`/(owner)/establishment-data?establishmentId=${establishmentId ?? ""}`}
          goalNoun="aparecer aos clientes"
        />

        {/* Os dois numeros que o dono abre o app pra ver. A fila e o CAMINHO
            pras filas, no lugar do botão ambar "Ver Filas" que competia com
            tudo.

            [marca-vupth] O verde-marca e ACENTO, não cor de "clicavel". O
            Pencil usa 1-2 elementos brand-green por tela contra 3-8 em
            surface (PROF · 03: 1 verde, 8 surface) — quando tudo e verde,
            nada e. Com a fila VAZIA não há destaque a dar (zero e a ausencia
            de fila, não o número que importa), entao o card fica neutro e o
            verde sobra pra única ação da tela. Com gente na fila ele reassume
            o acento e as ações viram texto discreto. */}
        <HStack mt="$5" space="md">
          <Pressable
            flex={1}
            onPress={() =>
              router.push({
                pathname: "/(owner)/queues",
                params: { establishmentId: establishment.id },
              } as any)
            }
            bg={totalInQueue > 0 ? "$brandGreen" : "$brandSurface"}
            p="$4"
            borderRadius="$card"
          >
            <HStack justifyContent="space-between" alignItems="flex-start">
              <Text fontFamily="$display" fontSize={32} color="$forest">
                {totalInQueue}
              </Text>
              <ChevronRight size={18} color="#163300" />
            </HStack>
            <Text
              fontFamily="$body"
              fontSize="$xs"
              fontWeight="$semibold"
              color={totalInQueue > 0 ? "$forest" : "$brandTextSecondary"}
              mt="$1"
            >
              na fila agora
            </Text>
          </Pressable>

          <VStack flex={1} bg="$brandSurface" p="$4" borderRadius="$card">
            <Text fontFamily="$display" fontSize={32} color="$forest">
              {queueData?.available_professionals ?? 0}
            </Text>
            <Text
              fontFamily="$body"
              fontSize="$xs"
              fontWeight="$semibold"
              color="$brandTextSecondary"
              mt="$1"
            >
              profissionais ativos
            </Text>
          </VStack>
        </HStack>

        {/* Abrir e a unica acao de PESO aqui: e o que destrava o dia. Encerrar
            e pausar viraram texto discreto — não sao erros nem perigo, sao o
            fim normal do expediente (e "fechar" em vermelho fazia parecer que
            o dono estava fechando o NEGOCIO). */}
        {!isOpen ? (
          <VStack mt="$5">
            {/* [marca-vupth] Era bg="$forest" (par forest+branco, fora da id): o
                Button/Primary do Pencil e brandGreen+forest. BrandButton já
                nasce nesse par — sem overrides de cor. */}
            <BrandButton
              title={status === "TEMPORARILY_CLOSED" ? "Reabrir agora" : "Abrir estabelecimento"}
              onPress={() => setStatus("OPEN")}
              isLoading={isToggling}
            />
          </VStack>
        ) : (
          <VStack mt="$5" space="sm">
            <HStack justifyContent="space-between" alignItems="center">
              <Pressable
                onPress={() => {
                  if (hasActiveWork) {
                    Alert.alert(
                      "Ainda tem gente na fila",
                      "Use 'Pausar entrada' para não receber novos clientes e terminar quem já está esperando.",
                    );
                    return;
                  }
                  setStatus("CLOSED");
                }}
                disabled={isToggling}
              >
                <HStack space="xs" alignItems="center">
                  <Moon size={15} color="#454745" />
                  <Text fontFamily="$body" fontSize="$sm" fontWeight="$semibold" color="$brandTextSecondary">
                    Encerrar o dia
                  </Text>
                </HStack>
              </Pressable>

              <Pressable
                onPress={() => setStatus("TEMPORARILY_CLOSED")}
                disabled={isToggling}
              >
                <HStack space="xs" alignItems="center">
                  <Pause size={15} color="#454745" />
                  <Text fontFamily="$body" fontSize="$sm" fontWeight="$semibold" color="$brandTextSecondary">
                    Pausar entrada
                  </Text>
                </HStack>
              </Pressable>
            </HStack>
          </VStack>
        )}

        <Divider my="$6" />

        <HStack justifyContent="space-between" alignItems="center" mb="$3">
          <Heading size="lg" fontFamily="$heading">
            Profissionais
          </Heading>
          <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary">
            {professionals.length} cadastrado{professionals.length !== 1 ? "s" : ""}
          </Text>
        </HStack>

        {professionals.length === 0 ? (
          // [marca-vupth] Card do estado vazio no `surface` da marca (era
          // coolGray + borda cinza, paleta neutra generica) e o botao em
          // OUTLINE: e acao terciaria dentro de um placeholder, nao pode ter
          // o mesmo peso do "Reabrir agora" logo acima — eram duas pilulas
          // verde-marca identicas na mesma tela.
          <VStack bg="$brandSurface" p="$4" borderRadius="$card" alignItems="center">
            <Text fontFamily="$body" color="$brandTextSecondary" textAlign="center">
              Nenhum profissional vinculado
            </Text>
            <BrandButton
              title="Adicionar profissional"
              variant="outline"
              onPress={() =>
                router.push({
                  pathname: "/(owner)/add-professional",
                  params: { establishmentId: establishment.id },
                } as any)
              }
              mt="$3"
              h="$10"
            />
          </VStack>
        ) : (
          <VStack space="sm">
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
                bg="$brandSurface"
                py="$4"
                px="$4"
                borderRadius="$card"
                $active-bg="$brandSurface"
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <VStack flex={1}>
                    <Text fontFamily="$heading" fontWeight="$bold" color="$forest">
                      {prof.name}
                    </Text>
                    <Text fontFamily="$body" fontSize="$xs" color="$brandTextSecondary">
                      {prof.specialty ?? "Sem especialidade"}
                    </Text>
                  </VStack>
                  <VStack alignItems="flex-end">
                    <Badge
                      action={prof.queue_count > 0 ? "success" : "muted"}
                      variant="solid"
                      borderRadius="$md"
                    >
                      <BadgeText fontSize="$xs">{prof.queue_count} na fila</BadgeText>
                    </Badge>
                    <Text fontFamily="$body" fontSize="$xs" color={prof.is_available ? "$forest" : "$brandTextSecondary"} mt="$1">
                      {prof.is_available ? "Disponivel" : "Indisponivel"}
                    </Text>
                  </VStack>
                </HStack>
              </Pressable>
            ))}
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
