import { useState } from "react";
import { Alert, Modal, View } from "react-native";
import { router } from "expo-router";
import { VStack, HStack, Text, Pressable } from "@gluestack-ui/themed";
import { useAuthStore } from "@store/auth.store";
import { BenchIcon } from "@components/BenchIcon";
import { comingSoon } from "@components/comingSoon";
import { cardShadow } from "@lib/styles";
import type { MealSignal } from "@lib/meals";

// Menu de OPCOES DA FILA (design Andre 2026-07-20, mockup
// design/queue-menu-icon-options.html). Substitui a tab bar do rodape.
//
// REGRA DE CONTEUDO (Andre): o menu e do DIA A DIA — status, abrir/fechar,
// solicitacoes, refeicao, add cliente. O que e raro (nome, especialidade,
// apelido, e-mail, senha, servicos) vive em Configuracoes, no RODAPE discreto.
// "Acompanhar" fica no meio porque e consulta, nao acao.
//
// Gatilho = BANCO (espera/fila). "outra hora a gente muda" — trocar o icone e
// so trocar <BenchIcon/> por outro componente SVG.
//
// DOT (vermelho) = ha algo a resolver atras do menu: refeicao sinalizada
// (`mealPhase`, que acende 30min ANTES), pendencia de cadastro (`settingsDot`)
// ou solicitacoes de corte pendentes (`pendingRequests`).
type StatusKey = "trabalhando" | "intervalo" | "indisponivel";

type Props = {
  /**
   * Sinal da refeicao (ver src/lib/meals.ts). Acende o dot e alimenta a
   * CONTAGEM REGRESSIVA no proprio item — e assim que o profissional fica
   * sabendo, sem popup na tela (regra do Andre: "sem intromissao").
   */
  mealSignal?: MealSignal | null;
  settingsDot?: boolean;
  /**
   * Abrir/fechar o estabelecimento (backend aceita profissional afiliado).
   * `isOpen`    = chave MANUAL (`open_status == OPEN`) — e o que o toggle alterna.
   * `isOpenNow` = EFETIVO (`is_open` do backend: aberta **e** dentro do horario).
   * Os dois divergem quando passou do `closing_time` com a chave ainda em OPEN:
   * o cliente ja ve fechado e o gate barra a entrada, entao dizer "ABERTA" aqui
   * seria mentira.
   */
  establishment?: { isOpen: boolean; isOpenNow: boolean; onToggle: () => void };
  /** Rotulo da refeicao em destaque, ex.: "Almoco 12:00". */
  mealLabel?: string;
  /** Ha atendimento/fila? Bloqueia "indisponivel" (mesma regra do S1). */
  hasQueue?: boolean;
  /**
   * Solicitacoes de corte pendentes. So renderiza quando > 0 — hoje o backend
   * nao tem como informar (ver HANDOFF_BACKEND "Detalhe — C2"), entao o item
   * fica ausente ate o contrato existir. Nada de UI falsa.
   */
  pendingRequests?: number;
};

const STATUS: { key: StatusKey; label: string }[] = [
  { key: "trabalhando", label: "Trabalhando" },
  { key: "intervalo", label: "Intervalo" },
  { key: "indisponivel", label: "Fora" },
];

// Section/Row ficam no ESCOPO DO MODULO de proposito: definidos dentro do
// componente, o React trataria cada render como um tipo novo e remontaria a
// subarvore — e a inferencia dos props do gluestack, reavaliada a cada
// instanciacao, estourava a pilha do tsc (segfault no typecheck).
function Section({ title }: { title: string }) {
  return (
    <Text
      fontFamily="$heading"
      fontWeight="$bold"
      fontSize="$2xs"
      color="$coolGray400"
      letterSpacing="$lg"
      px="$4"
      pt="$3"
      pb="$1"
      bg="$coolGray50"
    >
      {title.toUpperCase()}
    </Text>
  );
}

type RowProps = {
  icon: string;
  label: string;
  hint?: string;
  dot?: boolean;
  badge?: number;
  onPress?: () => void;
  children?: React.ReactNode;
};

function Row({ icon, label, hint, dot, badge, onPress, children }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      px="$4"
      py="$3"
      borderTopWidth="$1"
      borderColor="$coolGray100"
      $active-bg="$coolGray50"
    >
      <HStack alignItems="center" space="md">
        <Text fontSize="$md" w="$6" textAlign="center">
          {icon}
        </Text>
        <VStack flex={1}>
          <Text fontFamily="$body" fontSize="$md" fontWeight="$medium" color="$coolGray900">
            {label}
          </Text>
          {hint && (
            <Text fontFamily="$body" fontSize="$xs" color="$coolGray500" mt="$0.5">
              {hint}
            </Text>
          )}
        </VStack>
        {children}
        {badge != null && badge > 0 && (
          <VStack
            testID="menu-badge-requests"
            bg="$red600"
            borderRadius="$full"
            px="$2"
            minWidth="$5"
            h="$5"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontFamily="$heading" fontWeight="$bold" fontSize="$2xs" color="$white">
              {badge}
            </Text>
          </VStack>
        )}
        {dot && (
          <View
            testID="menu-dot-meals"
            style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: "#E63946" }}
          />
        )}
      </HStack>
    </Pressable>
  );
}

export function ProfessionalMenu({
  mealSignal = null,
  settingsDot = false,
  establishment,
  mealLabel,
  hasQueue = false,
  pendingRequests = 0,
}: Props) {
  const [open, setOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const hasOwner = useAuthStore((s) => s.user?.roles?.includes("OWNER"));

  // S1 ainda nao entregue: o status atual e fixo e qualquer troca cai no stub.
  const currentStatus: StatusKey = "trabalhando";

  const go = (path: string) => {
    setOpen(false);
    router.push(path as any);
  };

  const selectStatus = (next: StatusKey) => {
    // Parte front-only do S1: com fila, "Fora" nem chega a tentar.
    if (next === "indisponivel" && hasQueue) return;
    comingSoon("O controle de status (Trabalhando / Intervalo / Fora)");
  };

  const handleLogout = () => {
    setOpen(false);
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)" as any);
        },
      },
    ]);
  };

  const mealDot = mealSignal != null;
  const showDot = mealDot || settingsDot || pendingRequests > 0;
  // Contagem regressiva no item: substitui o popup como forma de avisar.
  const mealHint =
    mealSignal == null
      ? "almoco / janta — entram no ETA"
      : mealSignal.phase === "agora"
        ? "esta na hora — iniciar, adiar ou pular"
        : `em ${mealSignal.minutesUntil} min — iniciar agora ou adiar`;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Opcoes da fila"
        hitSlop={8}
        w="$10"
        h="$10"
        borderRadius="$xl"
        bg="$white"
        alignItems="center"
        justifyContent="center"
        style={cardShadow}
        $active-bg="$green50"
      >
        <BenchIcon />
        {showDot && (
          <View
            testID="menu-dot"
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#E63946",
              borderWidth: 2,
              borderColor: "#F7FAF8",
            }}
          />
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          accessibilityLabel="Fechar menu"
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.30)", justifyContent: "flex-start", padding: 16, paddingTop: 80 }}
        >
          <Pressable testID="menu-sheet" onPress={() => {}} style={{ width: "100%" }}>
            <VStack bg="$white" borderRadius="$2xl" overflow="hidden" style={cardShadow}>
              {/* Topo com "voltar": fecha o menu. Distinto do "Sair" do rodape,
                  que e LOGOUT (pedido do Andre p/ nao confundir os dois). */}
              <HStack alignItems="center" space="sm" px="$3" py="$2.5" borderBottomWidth="$1" borderColor="$coolGray100">
                <Pressable
                  onPress={() => setOpen(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Voltar"
                  hitSlop={8}
                  w="$8"
                  h="$8"
                  borderRadius="$lg"
                  bg="$coolGray50"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontFamily="$heading" fontWeight="$bold" fontSize="$lg" color="$green700">
                    ‹
                  </Text>
                </Pressable>
                <Text fontFamily="$heading" fontWeight="$bold" fontSize="$sm" color="$coolGray700">
                  Opcoes da fila
                </Text>
              </HStack>

              <Section title="Agora" />
              <Row icon="🟢" label="Status">
                <HStack space="xs">
                  {STATUS.map((s) => {
                    const active = s.key === currentStatus;
                    const blocked = s.key === "indisponivel" && hasQueue;
                    return (
                      <Pressable
                        key={s.key}
                        onPress={() => selectStatus(s.key)}
                        accessibilityRole="button"
                        accessibilityLabel={s.label}
                        opacity={blocked ? 0.45 : 1}
                        bg={active ? "$green500" : "$coolGray100"}
                        borderRadius="$full"
                        px="$2.5"
                        py="$1"
                      >
                        <Text
                          fontFamily="$heading"
                          fontWeight="$bold"
                          fontSize="$2xs"
                          color={active ? "$white" : "$coolGray600"}
                        >
                          {s.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </HStack>
              </Row>

              {establishment && (
                <Row
                  icon={!establishment.isOpen ? "🔒" : establishment.isOpenNow ? "🏪" : "🌙"}
                  label={establishment.isOpen ? "Fechar estabelecimento" : "Abrir estabelecimento"}
                  hint={
                    !establishment.isOpen
                      ? "a loja esta FECHADA agora"
                      : establishment.isOpenNow
                        ? "a loja esta ABERTA agora"
                        : "marcada como aberta, mas FORA DO HORARIO — clientes nao entram"
                  }
                  onPress={() => {
                    setOpen(false);
                    establishment.onToggle();
                  }}
                />
              )}

              <Row
                icon="🚦"
                label="Fechar fila"
                hint="termina quem ja esta; ninguem novo entra"
                onPress={() => {
                  setOpen(false);
                  comingSoon("Fechar fila");
                }}
              />

              <Section title="Hoje" />
              {pendingRequests > 0 && (
                <Row
                  icon="✋"
                  label="Solicitacoes"
                  hint="fila fechada — pedidos de corte"
                  badge={pendingRequests}
                  // Aceitar/recusar ainda nao tem tela: o backend nao expoe o
                  // id do pedido (HANDOFF "Detalhe — C2"). Navegar p/ a fila
                  // seria ir p/ onde ja se esta — melhor dizer "em breve".
                  onPress={() => {
                    setOpen(false);
                    comingSoon("Aceitar ou recusar solicitacoes de corte");
                  }}
                />
              )}
              <Row
                icon="🍽️"
                label={mealLabel ?? "Refeicoes"}
                hint={mealHint}
                dot={mealDot}
                onPress={() => go("/(professional)/meals")}
              />
              <Row
                icon="➕"
                label="Adicionar cliente"
                hint="walk-in, sem app"
                onPress={() => go("/(professional)/add-guest")}
              />

              <Section title="Acompanhar" />
              <Row
                icon="📊"
                label="Meu dia"
                hint="atendidos, faturamento, tempo medio"
                onPress={() => go("/(professional)/reports")}
              />
              <Row
                icon="📋"
                label="Atendimentos"
                hint="historico"
                onPress={() => go("/(professional)/attendances")}
              />

              {hasOwner && (
                <>
                  <Section title="Papel" />
                  <Row
                    icon="🏢"
                    label="Area do dono"
                    onPress={() => {
                      setOpen(false);
                      router.replace("/(owner)/dashboard" as any);
                    }}
                  />
                </>
              )}

              {/* Rodape discreto: o que NAO e do dia a dia. */}
              <HStack borderTopWidth="$1" borderColor="$coolGray200" bg="$coolGray50">
                <Pressable
                  flex={1}
                  onPress={() => go("/(professional)/settings")}
                  accessibilityRole="button"
                  accessibilityLabel="Configuracoes"
                  py="$3"
                  alignItems="center"
                  $active-bg="$coolGray100"
                >
                  <HStack alignItems="center" space="xs">
                    <Text fontSize="$sm">⚙️</Text>
                    <Text fontFamily="$body" fontSize="$sm" fontWeight="$medium" color="$coolGray600">
                      Configuracoes
                    </Text>
                    {settingsDot && (
                      <View
                        testID="menu-dot-settings"
                        style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#E63946" }}
                      />
                    )}
                  </HStack>
                </Pressable>
                <Pressable
                  flex={1}
                  onPress={handleLogout}
                  accessibilityRole="button"
                  accessibilityLabel="Sair"
                  py="$3"
                  alignItems="center"
                  borderLeftWidth="$1"
                  borderColor="$coolGray200"
                  $active-bg="$coolGray100"
                >
                  <HStack alignItems="center" space="xs">
                    <Text fontSize="$sm">↪</Text>
                    <Text fontFamily="$body" fontSize="$sm" fontWeight="$medium" color="$red600">
                      Sair
                    </Text>
                  </HStack>
                </Pressable>
              </HStack>
            </VStack>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
