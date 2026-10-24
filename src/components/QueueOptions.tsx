import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { Unlock, Lock, Inbox, UtensilsCrossed } from "lucide-react-native";
import { router } from "expo-router";
import { comingSoon } from "@components/comingSoon";
import { NotificationBadge } from "@components/NotificationBadge";
import type { MealSignal } from "@lib/meals";
import { useTema } from "@hooks/useTema";
import { DotNoCanto } from "@components/DotNoCanto";
import type { NomeDeCor } from "@theme/tema";

// Conteudo da tela "OPCOES DA FILA" (nav v2, Andre 2026-07-23, mockup
// design/professional-nav-v2.html). Substitui o antigo menu-modal do banco:
// agora e TELA CHEIA ("mais amigavel"), SEM duplicar o rodape (Fila/Relatorios/
// Configuracoes vivem la; Sair/Area do dono vivem em Configuracoes).
// So ACOES DO DIA: Status, Fechar fila, Solicitacoes, Refeicoes.
//
// ⚠️ "Adicionar cliente" SAIU daqui em 2026-08-26 (DS3): e a acao mais
// frequente do dia e estava a tres toques, no mesmo lugar do status. Foi pra
// tela da Fila, abaixo da lista. O status tambem esta duplicado la agora, na
// pilula do cabecalho — esta tela segue sendo o caminho longo, nao o unico.
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
//
// `cor` e o NOME da cor do tema (cores[cor]), como em STATUS_META. O ativo de
// Trabalhando e o papel `selecionado` (forest no claro, green no escuro: forest
// no escuro e a surface do cartao e o botao ativo sumiria).
const STATUS: {
  key: StatusKey; label: string; activeBg: string; activeText: string; cor: NomeDeCor;
}[] = [
  { key: "trabalhando", label: "Trabalhando", activeBg: "bg-vupth-selecionado", activeText: "text-vupth-onSelecionadoBranco", cor: "green" },
  // [marca-vupth] `intervalo` e o unico ativo com fundo CLARO (warning #FFC091,
  // que era bg-amber-500 da escala antiga) — por isso o texto e o par dele
  // (onAccentPeach, forest no claro), e nao o branco dos outros dois: sobre
  // claro a marca manda usar forest.
  { key: "intervalo", label: "Intervalo", activeBg: "bg-vupth-warning", activeText: "text-vupth-onAccentPeach", cor: "pessego" },
  { key: "indisponivel", label: "Fora", activeBg: "bg-vupth-danger", activeText: "text-vupth-onDanger", cor: "danger" },
];

// Section/Row no escopo do MODULO (licao do segfault do tsc: definidos dentro
// do componente, a inferencia do gluestack por instanciacao estourava a pilha,
// alem do anti-padrao React de remontar a subarvore).
function Section({ title }: { title: string }) {
  return (
    <Text className="font-heading text-f10 text-vupth-textSecondary tracking-widest mt-5 mb-2">
      {title.toUpperCase()}
    </Text>
  );
}

type RowProps = {
  icon: ReactNode;
  label: string;
  hint?: string;
  dot?: boolean;
  badge?: number;
  onPress?: () => void;
  children?: React.ReactNode;
};

function Row({ icon, label, hint, dot, badge, onPress, children }: RowProps) {
  const { cores } = useTema();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="bg-vupth-surface px-4 py-3.5 rounded-card mb-2 active:bg-vupth-surfaceAlt"
    >
      <View className="flex-row items-center gap-3">
        <View className="w-6 items-center">{icon}</View>
        <View className="flex-1">
          <Text className="font-body text-base font-medium text-vupth-textPrimary">
            {label}
          </Text>
          {hint && (
            <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">{hint}</Text>
          )}
        </View>
        {children}
        {badge != null && <NotificationBadge count={badge} testID="menu-badge-requests" />}
      </View>
      {/* dot-no-canto-do-card: sobre a borda arredondada, canto superior direito. */}
      {dot && (
        <DotNoCanto testID="menu-dot-meals">
          <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: cores.danger }} />
        </DotNoCanto>
      )}
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
  const { cores } = useTema();
  // ⚠️ Nao inventar um valor quando o status ainda nao chegou. Isto ja dizia
  // "Você está: Trabalhando" com o status DESCONHECIDO — num recarregamento
  // frio a tela afirmava o contrario da verdade, e o profissional que estava
  // "Fora" lia que estava trabalhando. Achado ao pôr a pilula no cabecalho:
  // ela dizia "Fora" e esta tela, ao lado, dizia "Trabalhando".
  const currentStatus = status?.current ?? null;
  const currentLabel = currentStatus ? STATUS.find((s) => s.key === currentStatus)?.label : null;

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
        ? "está na hora — iniciar, adiar ou pular"
        : `em ${mealSignal.minutesUntil} min — iniciar agora ou adiar`;

  return (
    <View>
      <Section title="Agora" />

      {/* Status em bloco proprio, pills LARGAS embaixo (affordance — Andre
          2026-07-24: "só melhora saber que dá pra clicar ali e mudar o estado").
          Não há mais botão de abrir/fechar loja: ficar "Trabalhando" abre sozinho
          (derivado); a tela avisa "você é o primeiro". */}
      <View
        className="bg-vupth-surface px-4 py-3.5 rounded-card mb-2"
      >
        <View className="flex-row items-center gap-3">
          {/* O ponto do semaforo: a cor do status atual. Era 🟢/🟡/🔴 —
              emoji nao herda a paleta nem escala com o texto. */}
          <View className="w-6 items-center">
            <View
              testID="status-dot"
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: cores[STATUS.find((s) => s.key === currentStatus)?.cor ?? "border"],
              }}
            />
          </View>
          <View className="flex-1">
            <Text className="font-body text-base font-medium text-vupth-textPrimary">
              Status
            </Text>
            <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">
              {currentLabel ? `Você está: ${currentLabel} · toque para trocar` : "Toque para definir"}
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
                // [marca-vupth] Pill inativa em branco, e nao no greenTint: estas
                // pills sao um SEMAFORO (verde/ambar/vermelho no `activeBg`) — um
                // fundo esverdeado no estado inativo leria como "Trabalhando".
                className={`flex-1 rounded-full py-2.5 items-center ${
                  active ? s.activeBg : "bg-vupth-background"
                }`}
              >
                <Text
                  className={`font-heading text-xs ${
                    active ? s.activeText : "text-vupth-textSecondary"
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
          icon={<Unlock size={18} color={cores.textPrimary} />}
          label="Reabrir fila"
          hint="fila fechada para proximos clientes"
          onPress={closeQueue.onToggle}
        />
      ) : (
        <Row
          icon={<Lock size={18} color={cores.textPrimary} />}
          label="Fechar fila"
          hint="termina quem já está; ninguém novo entra"
          onPress={() => (closeQueue ? closeQueue.onToggle() : comingSoon("Fechar fila"))}
        />
      )}

      <Section title="Hoje" />
      {pendingRequests > 0 && (
        <Row
          icon={<Inbox size={18} color={cores.textPrimary} />}
          label="Solicitações"
          hint="fila fechada — pedidos de corte"
          badge={pendingRequests}
          onPress={() => {
            if (onOpenRequests) onOpenRequests();
            else comingSoon("Aceitar ou recusar solicitações de corte");
          }}
        />
      )}
      <Row
        icon={<UtensilsCrossed size={18} color={cores.textPrimary} />}
        label={mealLabel ?? "Refeições"}
        hint={mealHint}
        dot={mealDot}
        onPress={() => router.push("/(professional)/meals?from=queue-options" as any)}
      />
    </View>
  );
}
