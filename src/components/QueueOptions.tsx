import { View } from "react-native";
import { router } from "expo-router";
import { VStack, HStack, Text, Pressable } from "@gluestack-ui/themed";
import { comingSoon } from "@components/comingSoon";
import type { MealSignal } from "@lib/meals";

// Conteudo da tela "OPCOES DA FILA" (nav v2, Andre 2026-07-23, mockup
// design/professional-nav-v2.html). Substitui o antigo menu-modal do banco:
// agora e TELA CHEIA ("mais amigavel"), SEM duplicar o rodape (Fila/Meu dia/
// Configuracoes vivem la; Sair/Area do dono vivem em Configuracoes).
// So ACOES DO DIA: Status, Fechar fila, Solicitacoes, Refeicoes, Adicionar cliente.
//
// ⚠️ SEM "abrir/fechar estabelecimento" (decisao Andre 2026-07-24): o profissional
// nao mexe na loja na mao — ele so muda o PROPRIO status. Ao ficar "Trabalhando"
// sendo o primeiro, a loja abre sozinha (derivado, backend S1 f2); ao "Fechar
// fila" sendo o ultimo, ela fecha. O aviso "voce e o primeiro/ultimo" vive na
// tela (queue-options.tsx), que sabe o open_status.
type StatusKey = "trabalhando" | "intervalo" | "indisponivel";

type Props = {
  mealSignal?: MealSignal | null;
  mealLabel?: string;
  hasQueue?: boolean;
  status?: { current: StatusKey | null; onSelect: (next: StatusKey) => void };
  pendingRequests?: number;
  onOpenRequests?: () => void;
};

// Semaforo (Andre 2026-07-23): verde trabalhando, ambar intervalo, vermelho fora.
const STATUS: { key: StatusKey; label: string; activeBg: string; emoji: string }[] = [
  { key: "trabalhando", label: "Trabalhando", activeBg: "$green500", emoji: "🟢" },
  { key: "intervalo", label: "Intervalo", activeBg: "$amber500", emoji: "🟡" },
  { key: "indisponivel", label: "Fora", activeBg: "$red500", emoji: "🔴" },
];

// Section/Row no escopo do MODULO (licao do segfault do tsc: definidos dentro
// do componente, a inferencia do gluestack por instanciacao estourava a pilha,
// alem do anti-padrao React de remontar a subarvore).
function Section({ title }: { title: string }) {
  return (
    <Text
      fontFamily="$heading"
      fontWeight="$bold"
      fontSize="$2xs"
      color="$coolGray400"
      letterSpacing="$lg"
      mt="$5"
      mb="$2"
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
      bg="$white"
      px="$4"
      py="$3.5"
      borderRadius="$2xl"
      mb="$2"
      $active-bg="$coolGray50"
      style={{
        shadowColor: "#1A281A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
      }}
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

export function QueueOptions({
  mealSignal = null,
  mealLabel,
  hasQueue = false,
  status,
  pendingRequests = 0,
  onOpenRequests,
}: Props) {
  const currentStatus: StatusKey = status?.current ?? "trabalhando";
  const currentLabel = STATUS.find((s) => s.key === currentStatus)?.label ?? "Trabalhando";

  const selectStatus = (next: StatusKey) => {
    // Prevencao de clique (S1): com fila, "Fora" nem chega a tentar — o 409 do
    // backend fica so como rede de seguranca.
    if (next === "indisponivel" && hasQueue) return;
    if (next === currentStatus) return; // ja esta nesse status
    if (status) status.onSelect(next);
    else comingSoon("O controle de status (Trabalhando / Intervalo / Fora)");
  };

  const mealDot = mealSignal != null;
  const mealHint =
    mealSignal == null
      ? "almoco / janta — entram no ETA"
      : mealSignal.phase === "agora"
        ? "esta na hora — iniciar, adiar ou pular"
        : `em ${mealSignal.minutesUntil} min — iniciar agora ou adiar`;

  return (
    <VStack>
      <Section title="Agora" />

      {/* Status em bloco proprio, pills LARGAS embaixo (affordance — Andre
          2026-07-24: "so melhora saber que da pra clicar ali e mudar o estado").
          Nao ha mais botao de abrir/fechar loja: ficar "Trabalhando" abre sozinho
          (derivado); a tela avisa "voce e o primeiro". */}
      <VStack
        bg="$white"
        px="$4"
        py="$3.5"
        borderRadius="$2xl"
        mb="$2"
        style={{
          shadowColor: "#1A281A",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 3,
        }}
      >
        <HStack alignItems="center" space="md">
          <Text fontSize="$md" w="$6" textAlign="center">
            {STATUS.find((s) => s.key === currentStatus)?.emoji ?? "🟢"}
          </Text>
          <VStack flex={1}>
            <Text fontFamily="$body" fontSize="$md" fontWeight="$medium" color="$coolGray900">
              Status
            </Text>
            <Text fontFamily="$body" fontSize="$xs" color="$coolGray500" mt="$0.5">
              Voce esta: {currentLabel} · toque para trocar
            </Text>
          </VStack>
        </HStack>
        <HStack space="sm" mt="$3">
          {STATUS.map((s) => {
            const active = s.key === currentStatus;
            const blocked = s.key === "indisponivel" && hasQueue;
            return (
              <Pressable
                key={s.key}
                onPress={() => selectStatus(s.key)}
                accessibilityRole="button"
                accessibilityLabel={s.label}
                accessibilityState={{ selected: active, disabled: blocked }}
                opacity={blocked ? 0.45 : 1}
                flex={1}
                bg={active ? s.activeBg : "$coolGray100"}
                borderRadius="$full"
                py="$2.5"
                alignItems="center"
              >
                <Text
                  fontFamily="$heading"
                  fontWeight="$bold"
                  fontSize="$xs"
                  color={active ? "$white" : "$coolGray600"}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </HStack>
      </VStack>

      <Row
        icon="🚦"
        label="Fechar fila"
        hint="termina quem ja esta; ninguem novo entra"
        onPress={() => comingSoon("Fechar fila")}
      />

      <Section title="Hoje" />
      {pendingRequests > 0 && (
        <Row
          icon="✋"
          label="Solicitacoes"
          hint="fila fechada — pedidos de corte"
          badge={pendingRequests}
          onPress={() => {
            if (onOpenRequests) onOpenRequests();
            else comingSoon("Aceitar ou recusar solicitacoes de corte");
          }}
        />
      )}
      <Row
        icon="🍽️"
        label={mealLabel ?? "Refeicoes"}
        hint={mealHint}
        dot={mealDot}
        onPress={() => router.push("/(professional)/meals" as any)}
      />
      <Row
        icon="➕"
        label="Adicionar cliente"
        hint="walk-in, sem app"
        onPress={() => router.push("/(professional)/add-guest" as any)}
      />
    </VStack>
  );
}
