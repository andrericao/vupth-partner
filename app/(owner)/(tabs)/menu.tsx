import {
  VStack,
  HStack,
  Text,
  Pressable,
  ScrollView,
} from "@gluestack-ui/themed";
import { Alert } from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { useEstablishmentStore } from "@store/establishment.store";
import { useProfessionalStore } from "@store/professional.store";
import { useAuthStore } from "@store/auth.store";
import { OtaUpdateButton } from "@components/OtaUpdateButton";
import { PendingDot } from "@components/PendingDot";
import { useOwnerCompletion } from "@hooks/useOwnerCompletion";
import { hasAnyPending } from "@lib/completion";
import { serviceTypeLabel } from "@lib/serviceTypes";
import { Users, ClipboardList, ChartColumn, Store, User, LogOut, ChevronRight, ArrowLeftRight } from "lucide-react-native";
import type { ComponentType } from "react";

// [marca-vupth] Era Ionicons (aproximacao); o Pencil (OWNER · 02 Menu)
// especifica o glifo exato via icon+library do no ("users", "clipboard-list",
// "chart-column", "store", "user", "log-out", "chevron-right", todos lucide).
type LucideIconType = ComponentType<{ size?: number; color?: string }>;

type MenuItemProps = {
  label: string;
  /** Linha de apoio — usada quando o item AGRUPA varios caminhos. */
  hint?: string;
  icon: LucideIconType;
  onPress: () => void;
  color?: string;
  dot?: boolean;
  /** Contagem que pede acao (ex.: solicitacoes pendentes). */
  badge?: number;
  /** Ultima linha do card nao leva divisor. */
  last?: boolean;
};

function MenuItem({
  label,
  hint,
  icon: Icon,
  onPress,
  color = "$forest",
  dot = false,
  badge,
  last = false,
}: MenuItemProps) {
  return (
    <>
      <Pressable onPress={onPress} py="$3.5" px="$4" $active-bg="$coolGray50">
        <HStack alignItems="center" space="md">
          <Icon size={19} color="#163300" />
          <VStack flex={1}>
            <HStack alignItems="center" space="sm">
              <Text fontFamily="$body" fontSize="$sm" fontWeight="$semibold" color={color}>
                {label}
              </Text>
              {dot && <PendingDot />}
            </HStack>
            {hint && (
              <Text fontFamily="$body" fontSize="$2xs" color="$coolGray500" mt="$0.5">
                {hint}
              </Text>
            )}
          </VStack>
          {badge != null && badge > 0 && (
            <VStack bg="$brandDanger" borderRadius="$full" px="$2" py="$0.5">
              <Text fontFamily="$display" fontSize={10} color="$white">
                {badge}
              </Text>
            </VStack>
          )}
          <ChevronRight size={16} color="#6B7280" />
        </HStack>
      </Pressable>
      {!last && <VStack height={1} bg="$border" />}
    </>
  );
}

/** Bloco de itens sob um rotulo — o agrupamento e o que tira o menu do "tudo igual". */
function Grupo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <VStack space="sm">
      <Text
        fontFamily="$body"
        fontSize={11}
        fontWeight="$bold"
        letterSpacing={0.8}
        color="$coolGray500"
      >
        {label}
      </Text>
      <VStack bg="$brandSurface" borderRadius="$card" overflow="hidden">
        {children}
      </VStack>
    </VStack>
  );
}

export default function OwnerMenuScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const resetEstablishment = useEstablishmentStore((s) => s.reset);
  const resetProfessional = useProfessionalStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { completion } = useOwnerCompletion();
  const hasPending = hasAnyPending(completion);

  const isProfessional = user?.roles?.includes("PROFESSIONAL");

  const handleLeaveEstablishment = () => {
    Alert.alert(
      "Sair do Estabelecimento",
      "Voce sera desvinculado deste estabelecimento. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair do Estabelecimento",
          style: "destructive",
          onPress: async () => {
            resetEstablishment();
            resetProfessional();
            router.replace("/(owner)/onboarding/establishment" as any);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair da conta?", [
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

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack flex={1} pb="$6" px="$4">
        <ScreenHeader
          title={establishment?.name ?? "Meu Estabelecimento"}
          subtitle={serviceTypeLabel(establishment?.service_type)}
        />

        <VStack space="xl">
          {/* Quem acumula os dois papeis troca de area por aqui. Fica FORA dos
              grupos porque nao e configuracao — e mudar de contexto. */}
          {isProfessional && (
            <Pressable
              onPress={() => router.replace("/(professional)/queue" as any)}
              bg="$greenTint"
              borderRadius="$card"
              py="$3.5"
              px="$4"
            >
              <HStack alignItems="center" space="md">
                {/* Sem equivalente no Pencil (elemento so do app, pra quem
                    acumula os dois papeis) — lucide por consistencia com o
                    resto do menu, ja que os outros icones deixaram de ser
                    Ionicons. */}
                <ArrowLeftRight size={19} color="#163300" />
                <Text fontFamily="$body" fontSize="$sm" fontWeight="$semibold" color="$forest" flex={1}>
                  Atender como profissional
                </Text>
                <ChevronRight size={16} color="#163300" />
              </HStack>
            </Pressable>
          )}

          {establishment?.id && (
            <Grupo label="EQUIPE">
              {/* UMA porta pra equipe. Eram TRES linhas de mesmo peso
                  (adicionar / convidar / solicitacoes) que levavam a variacoes
                  da mesma tarefa — e a propria tela de destino ja oferece os
                  tres caminhos. O badge traz a urgencia (solicitacao parada)
                  pra fora, que era o unico motivo real de separar. */}
              <MenuItem
                icon={Users}
                label="Profissionais"
                hint="adicionar, convidar e ver solicitações"
                onPress={() =>
                  router.push({
                    pathname: "/(owner)/add-professional",
                    params: { establishmentId: establishment.id },
                  } as any)
                }
                last
              />
            </Grupo>
          )}

          <Grupo label="NEGÓCIO">
            <MenuItem
              icon={ClipboardList}
              label="Atendimentos"
              onPress={() => router.push("/(owner)/attendances" as any)}
            />
            <MenuItem
              icon={ChartColumn}
              label="Relatórios"
              onPress={() => router.push("/(owner)/reports" as any)}
              last={!establishment?.id}
            />
            {establishment?.id && (
              <MenuItem
                icon={Store}
                label="Dados do estabelecimento"
                dot={hasPending}
                onPress={() =>
                  router.push({
                    pathname: "/(owner)/establishment-data",
                    params: { establishmentId: establishment.id },
                  } as any)
                }
                last
              />
            )}
          </Grupo>

          <Grupo label="CONTA">
            <MenuItem
              icon={User}
              label="Dados pessoais"
              onPress={() =>
                router.push({
                  pathname: "/(owner)/coming-soon",
                  params: { title: "Dados Pessoais" },
                } as any)
              }
              last={!establishment?.id}
            />
            {establishment?.id && (
              <MenuItem
                icon={LogOut}
                label="Sair do estabelecimento"
                onPress={handleLeaveEstablishment}
                last
              />
            )}
          </Grupo>

          {/* Sair da conta fica solto e em vermelho: e a unica acao aqui que
              tira a pessoa do app. */}
          <Pressable onPress={handleLogout} py="$2">
            <Text fontFamily="$body" fontSize="$sm" fontWeight="$semibold" color="$brandDanger">
              Sair da conta
            </Text>
          </Pressable>
        </VStack>

        <VStack flex={1} />

        <OtaUpdateButton />
      </VStack>
    </ScrollView>
  );
}
