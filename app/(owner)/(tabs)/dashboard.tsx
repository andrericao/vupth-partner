import { useState, useCallback, useEffect } from "react";
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
import { Header } from "@components/Header";
import { useEstablishmentStore } from "@store/establishment.store";
import { useQueuePolling } from "@hooks/useQueuePolling";
import { useOwnerCompletion } from "@hooks/useOwnerCompletion";
import { getApiErrorMessage } from "@lib/api";
import { cardShadow } from "@lib/styles";
import { serviceTypeLabel } from "@lib/serviceTypes";
import { ReadinessFaixa } from "@components/ReadinessFaixa";
import type { ProfessionalWithQueue } from "@lib/types";

export default function OwnerDashboardScreen() {
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

    // A validacao de "estabelecimento pronto" (>=1 profissional com >=1 servico)
    // e feita no backend (422 ESTABLISHMENT_NOT_READY). Tentamos abrir e tratamos o erro.
    setIsToggling(true);
    try {
      await updateOpenStatus(establishment.id, newStatus);
    } catch (error: any) {
      const code = error?.response?.data?.code;
      if (code === "ESTABLISHMENT_NOT_READY") {
        Alert.alert(
          "Estabelecimento sem profissional pronto",
          getApiErrorMessage(error, "Para abrir, e necessario ter pelo menos um profissional com servico cadastrado."),
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Adicionar Profissional",
              onPress: () =>
                router.push({
                  pathname: "/(owner)/add-professional",
                  params: { establishmentId: establishment.id },
                } as any),
            },
          ]
        );
      } else if (code === "ESTABLISHMENT_HOURS_REQUIRED") {
        Alert.alert(
          "Defina o horario de funcionamento",
          getApiErrorMessage(error, "Defina o horario de funcionamento do estabelecimento antes de abrir."),
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Definir Horario",
              onPress: () => router.push("/(owner)/establishment-hours" as any),
            },
          ]
        );
      } else if (code === "ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES") {
        Alert.alert(
          "Ha atendimentos em andamento",
          getApiErrorMessage(
            error,
            "Nao e possivel fechar enquanto ha clientes em atendimento ou na fila. Conclua a fila antes de fechar."
          )
        );
      } else {
        Alert.alert(
          "Erro",
          getApiErrorMessage(error, "Nao foi possivel atualizar o status. Tente novamente.")
        );
      }
    } finally {
      setIsToggling(false);
    }
  };

  if (!establishment) {
    return (
      <VStack flex={1} pb="$6" px="$6">
        <Header />
        <VStack flex={1} alignItems="center" justifyContent="center">
          <Text fontFamily="$body" color="$coolGray500">
            Nenhum estabelecimento encontrado.
          </Text>
          <BrandButton
            title="Criar Estabelecimento"
            onPress={() => router.push("/(owner)/onboarding/establishment" as any)}
            mt="$9"
          />
        </VStack>
      </VStack>
    );
  }

  return (
    <ScrollView
      w="$full"
      bg="$brandBackground"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <VStack flex={1} pb="$6" px="$5" bg="$brandBackground">
        <Header />

        <HStack justifyContent="space-between" alignItems="center" mt="$4" space="sm">
          {/* [marca-vupth] flex={1} sem gap encostava o nome comprido direto na
              pilula (QA Alexia: "Barbearia Teste Visual" grudado no "PAUSADO").
              space-between so distribui espaco SOBRANDO — com o texto flexivel
              preenchendo tudo, nao sobrava nada. */}
          <Text
            fontFamily="$display"
            fontSize={24}
            letterSpacing={-0.8}
            color="$forest"
            flex={1}
            numberOfLines={2}
          >
            {establishment.name}
          </Text>
          {/* Pausado fica AMBAR: e um estado que pede acao ("reabrir"), e no
              `$border` cinza sobre fundo claro a pilula sumia. */}
          <VStack
            bg={isOpen ? "$brandGreen" : status === "TEMPORARILY_CLOSED" ? "$amber500" : "$coolGray200"}
            borderRadius="$full"
            px="$3"
            py="$1.5"
          >
            <Text
              fontFamily="$display"
              fontSize={11}
              color={isOpen || status === "TEMPORARILY_CLOSED" ? "$forest" : "$coolGray600"}
            >
              {badge.label}
            </Text>
          </VStack>
        </HStack>

        <Text fontFamily="$body" fontSize="$sm" color="$coolGray500" mt="$1">
          {serviceTypeLabel(establishment.service_type)}
        </Text>

        <ReadinessFaixa
          completion={completion}
          targetRoute={`/(owner)/establishment-data?establishmentId=${establishmentId ?? ""}`}
          goalNoun="aparecer aos clientes"
        />

        {/* Os dois numeros que o dono abre o app pra ver. A fila e o CAMINHO
            pras filas, no lugar do botao ambar "Ver Filas" que competia com
            tudo.

            [marca-vupth] O verde-marca e ACENTO, nao cor de "clicavel". O
            Pencil usa 1-2 elementos brand-green por tela contra 3-8 em
            surface (PROF · 03: 1 verde, 8 surface) — quando tudo e verde,
            nada e. Com a fila VAZIA nao ha destaque a dar (zero e a ausencia
            de fila, nao o numero que importa), entao o card fica neutro e o
            verde sobra pra unica acao da tela. Com gente na fila ele reassume
            o acento e as acoes viram texto discreto. */}
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
              color={totalInQueue > 0 ? "$forest" : "$coolGray500"}
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
              color="$coolGray500"
              mt="$1"
            >
              profissionais ativos
            </Text>
          </VStack>
        </HStack>

        {/* Abrir e a unica acao de PESO aqui: e o que destrava o dia. Encerrar
            e pausar viraram texto discreto — nao sao erros nem perigo, sao o
            fim normal do expediente (e "fechar" em vermelho fazia parecer que
            o dono estava fechando o NEGOCIO). */}
        {!isOpen ? (
          <VStack mt="$5">
            {/* [marca-vupth] Era bg="$forest" (par forest+branco, fora da id): o
                Button/Primary do Pencil e brandGreen+forest. BrandButton ja
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
                      "Use 'Pausar entrada' para nao receber novos clientes e terminar quem ja esta esperando.",
                    );
                    return;
                  }
                  setStatus("CLOSED");
                }}
                disabled={isToggling}
              >
                <HStack space="xs" alignItems="center">
                  <Moon size={15} color="#6B7280" />
                  <Text fontFamily="$body" fontSize="$sm" fontWeight="$semibold" color="$coolGray500">
                    Encerrar o dia
                  </Text>
                </HStack>
              </Pressable>

              <Pressable
                onPress={() => setStatus("TEMPORARILY_CLOSED")}
                disabled={isToggling}
              >
                <HStack space="xs" alignItems="center">
                  <Pause size={15} color="#6B7280" />
                  <Text fontFamily="$body" fontSize="$sm" fontWeight="$semibold" color="$coolGray500">
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
          <Text fontFamily="$body" fontSize="$sm" color="$coolGray500">
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
            <Text fontFamily="$body" color="$coolGray500" textAlign="center">
              Nenhum profissional vinculado
            </Text>
            <BrandButton
              title="Adicionar Profissional"
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
                bg="$white"
                py="$4"
                px="$4"
                borderRadius="$2xl"
                style={cardShadow}
                $active-bg="$coolGray50"
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <VStack flex={1}>
                    <Text fontFamily="$heading" fontWeight="$bold" color="$coolGray900">
                      {prof.name}
                    </Text>
                    <Text fontFamily="$body" fontSize="$xs" color="$coolGray500">
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
                    <Text fontFamily="$body" fontSize="$xs" color={prof.is_available ? "$forest" : "$coolGray400"} mt="$1">
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
