import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { comingSoon } from "@components/comingSoon";
import { NotificationBadge } from "@components/NotificationBadge";
import type { MealSignal } from "@lib/meals";

// Conteudo da tela "OPCOES DA FILA" (nav v2, Andre 2026-07-23, mockup
// design/professional-nav-v2.html). Substitui o antigo menu-modal do banco:
// agora e TELA CHEIA ("mais amigavel"), SEM duplicar o rodape (Fila/Relatorios/
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
  /**
   * S1 fatia 3 ("fechar fila", backend 2026-07-23). acceptingNew=false => a fila
   * ja esta fechada (drenando), o item vira "Reabrir fila". Sem a prop, cai no
   * comingSoon (defesa — nao deveria ocorrer com o backend no ar).
   */
  closeQueue?: { acceptingNew: boolean; onToggle: () => void };
  pendingRequests?: number;
  onOpenRequests?: () => void;
};

// Semaforo (Andre 2026-07-23): verde trabalhando, ambar intervalo, vermelho fora.
const STATUS: { key: StatusKey; label: string; activeBg: string; emoji: string }[] = [
  { key: "trabalhando", label: "Trabalhando", activeBg: "bg-brand", emoji: "🟢" },
  { key: "intervalo", label: "Intervalo", activeBg: "bg-amber-500", emoji: "🟡" },
  { key: "indisponivel", label: "Fora", activeBg: "bg-danger-500", emoji: "🔴" },
];

// Sombra dos cards via style RN (mesma do v1).
const rowShadow = {
  shadowColor: "#1A281A",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.1,
  shadowRadius: 10,
  elevation: 3,
};

// Section/Row no escopo do MODULO (licao do segfault do tsc: definidos dentro
// do componente, a inferencia do gluestack por instanciacao estourava a pilha,
// alem do anti-padrao React de remontar a subarvore).
function Section({ title }: { title: string }) {
  return (
    <Text className="font-heading text-[10px] text-gray-400 tracking-widest mt-5 mb-2">
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
      className="bg-white px-4 py-3.5 rounded-2xl mb-2 active:bg-gray-50"
      style={rowShadow}
    >
      <View className="flex-row items-center gap-3">
        <Text className="text-base w-6 text-center">{icon}</Text>
        <View className="flex-1">
          <Text className="font-body text-base font-medium text-gray-900">
            {label}
          </Text>
          {hint && (
            <Text className="font-body text-xs text-gray-500 mt-0.5">{hint}</Text>
          )}
        </View>
        {children}
        {badge != null && <NotificationBadge count={badge} testID="menu-badge-requests" />}
        {dot && (
          <View
            testID="menu-dot-meals"
            style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: "#E63946" }}
          />
        )}
      </View>
    </Pressable>
  );
}

export function QueueOptions({
  mealSignal = null,
  mealLabel,
  hasQueue = false,
  status,
  closeQueue,
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
    <View>
      <Section title="Agora" />

      {/* Status em bloco proprio, pills LARGAS embaixo (affordance — Andre
          2026-07-24: "so melhora saber que da pra clicar ali e mudar o estado").
          Nao ha mais botao de abrir/fechar loja: ficar "Trabalhando" abre sozinho
          (derivado); a tela avisa "voce e o primeiro". */}
      <View
        className="bg-white px-4 py-3.5 rounded-2xl mb-2"
        style={rowShadow}
      >
        <View className="flex-row items-center gap-3">
          <Text className="text-base w-6 text-center">
            {STATUS.find((s) => s.key === currentStatus)?.emoji ?? "🟢"}
          </Text>
          <View className="flex-1">
            <Text className="font-body text-base font-medium text-gray-900">
              Status
            </Text>
            <Text className="font-body text-xs text-gray-500 mt-0.5">
              Voce esta: {currentLabel} · toque para trocar
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2 mt-3">
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
                style={{ opacity: blocked ? 0.45 : 1 }}
                className={`flex-1 rounded-full py-2.5 items-center ${
                  active ? s.activeBg : "bg-gray-100"
                }`}
              >
                <Text
                  className={`font-heading text-xs ${
                    active ? "text-white" : "text-gray-600"
                  }`}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {closeQueue && !closeQueue.acceptingNew ? (
        <Row
          icon="🔓"
          label="Reabrir fila"
          hint="fila fechada para proximos clientes"
          onPress={closeQueue.onToggle}
        />
      ) : (
        <Row
          icon="🚦"
          label="Fechar fila"
          hint="termina quem ja esta; ninguem novo entra"
          onPress={() => (closeQueue ? closeQueue.onToggle() : comingSoon("Fechar fila"))}
        />
      )}

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
        onPress={() => router.push("/(professional)/meals?from=queue-options" as any)}
      />
      <Row
        icon="➕"
        label="Adicionar cliente"
        hint="walk-in, sem app"
        onPress={() => router.push("/(professional)/add-guest" as any)}
      />
    </View>
  );
}
