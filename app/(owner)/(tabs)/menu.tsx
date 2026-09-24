
import {
  VStack,
  HStack,
  Text,
  Pressable,
  ScrollView,
} from "@gluestack-ui/themed";
import { View } from "react-native";
import { useVoltarAoTopo, usePilulaTopo } from "@hooks/useVoltarAoTopo";
import { PilulaVoltarAoTopo } from "@components/PilulaVoltarAoTopo";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { useEstablishmentStore } from "@store/establishment.store";
import { useProfessionalStore } from "@store/professional.store";
import { useAuthStore } from "@store/auth.store";
import { PendingDot } from "@components/PendingDot";
import { useOwnerCompletion } from "@hooks/useOwnerCompletion";
import { hasAnyPending } from "@lib/completion";
import { serviceTypeLabel } from "@lib/serviceTypes";
import { Users, ClipboardList, ChartColumn, Store, User, LogOut, ChevronRight, ArrowLeftRight,
  Info,
} from "lucide-react-native";
import type { ComponentType } from "react";
import { confirmar } from "@lib/confirmar";

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
      <Pressable onPress={onPress} py="$3.5" px="$4" $active-bg="$brandSurface">
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
              <Text fontFamily="$body" fontSize="$2xs" color="$brandTextSecondary" mt="$0.5">
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
          <ChevronRight size={16} color="#454745" />
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
        color="$brandTextSecondary"
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
  // Tocar na aba JA ATIVA volta ao topo (Andre, 18/09).
  const rolagemRef = useVoltarAoTopo();
  const pilula = usePilulaTopo(rolagemRef);

  const establishment = useEstablishmentStore((s) => s.establishment);
  const resetEstablishment = useEstablishmentStore((s) => s.reset);
  const resetProfessional = useProfessionalStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { completion } = useOwnerCompletion();
  const hasPending = hasAnyPending(completion);

  const isProfessional = user?.roles?.includes("PROFESSIONAL");

  const handleLeaveEstablishment = () => {
    confirmar({
      titulo: "Sair do Estabelecimento",
      mensagem: "Você será desvinculado deste estabelecimento. Deseja continuar?",
      confirmar: "Sair do Estabelecimento",
      destrutivo: true,
    }).then((ok) => {
      if (!ok) return;
      resetEstablishment();
      resetProfessional();
      router.replace("/(owner)/onboarding/establishment" as any);
    });
  };

  const handleLogout = () => {
    confirmar({
      titulo: "Sair",
      mensagem: "Tem certeza que deseja sair da conta?",
      confirmar: "Sair",
      destrutivo: true,
    }).then(async (ok) => {
      if (!ok) return;
      await logout();
      router.replace("/(auth)" as any);
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
          ref={rolagemRef}
          onScroll={pilula.onScroll}
          scrollEventThrottle={64}
        w="$full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack flex={1} pb="$6" px="$4">
          <ScreenHeader
            title={establishment?.name ?? "Meu estabelecimento"}
            subtitle={serviceTypeLabel(establishment?.service_type)}
          />
  
          <VStack space="xl">
            {/* Quem acumula os dois papeis troca de area por aqui. Fica FORA dos
                grupos porque não e configuracao — e mudar de contexto. */}
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
                      resto do menu, já que os outros ícones deixaram de ser
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
                    (adicionar / convidar / solicitações) que levavam a variacoes
                    da mesma tarefa — e a própria tela de destino já oferece os
                    três caminhos. O badge traz a urgencia (solicitação parada)
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
                    pathname: "/(professional)/settings-account",
                    params: { from: "owner" },
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
  
            {/* Sistema e um GRUPO da lista, na mesma altura de Conta — nao
                rodape. Estava abaixo do "Sair da conta", que e o fim da tela: la
                ninguem procura configuracao, procura a saida (correcao dele,
                11/09). */}
            <Grupo label="SISTEMA">
              <MenuItem
                icon={Info}
                label="Versão do app"
                onPress={() =>
                  router.push({
                    pathname: "/(professional)/sistema",
                    params: { from: "owner" },
                  } as any)
                }
                last
              />
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
        </VStack>
      </ScrollView>
      <PilulaVoltarAoTopo visivel={pilula.visivel} onPress={pilula.subir} />
    </View>
  );
}
