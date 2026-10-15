
import { View, Text, Pressable, ScrollView } from "react-native";
import { useVoltarAoTopo, usePilulaTopo } from "@hooks/useVoltarAoTopo";
import { PilulaVoltarAoTopo } from "@components/PilulaVoltarAoTopo";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { useEstablishmentStore } from "@store/establishment.store";
import { useProfessionalStore } from "@store/professional.store";
import { useAuthStore } from "@store/auth.store";
import { PendingDot } from "@components/PendingDot";
import { NotificationBadge } from "@components/NotificationBadge";
import { useOwnerCompletion } from "@hooks/useOwnerCompletion";
import { useSolicitacoesDeVinculo } from "@hooks/useSolicitacoesDeVinculo";
import { hasAnyPending } from "@lib/completion";
import { serviceTypeLabel } from "@lib/serviceTypes";
import { Users, ClipboardList, ChartColumn, Store, User, LogOut, ChevronRight, ArrowLeftRight, Palette,
  Info, LifeBuoy, QrCode,
} from "lucide-react-native";
import type { ComponentType } from "react";
import { confirmar } from "@lib/confirmar";
import { abrirSuporte } from "@lib/suporte";

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
  dot = false,
  badge,
  last = false,
}: MenuItemProps) {
  return (
    <>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        className="flex-row items-center gap-3 px-4 py-3.5 active:bg-vupth-greenTint"
      >
        <Icon size={19} color="#163300" />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-body text-sm font-semibold text-vupth-forest">{label}</Text>
            {dot && <PendingDot />}
          </View>
          {hint && (
            <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">{hint}</Text>
          )}
        </View>
        {/* O mesmo badge das Configuracoes do profissional (1..9, depois "9+"). */}
        {badge != null && badge > 0 && (
          <NotificationBadge count={badge} testID={`menu-badge-${label.toLowerCase()}`} />
        )}
        <ChevronRight size={16} color="#454745" />
      </Pressable>
      {!last && <View className="h-px bg-vupth-border" />}
    </>
  );
}

/** Bloco de itens sob um rotulo — o agrupamento e o que tira o menu do "tudo igual". */
function Grupo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="font-body text-f11 font-bold tracking-wider text-vupth-textSecondary">
        {label}
      </Text>
      <View className="bg-vupth-surface rounded-card overflow-hidden">{children}</View>
    </View>
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
  const solicitacoes = useSolicitacoesDeVinculo(establishment?.id);

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
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 pb-6 px-4">
          <ScreenHeader
            title={establishment?.name ?? ""}
            carregando={!establishment?.name}
            subtitle={serviceTypeLabel(establishment?.service_type)}
          />
  
          <View className="gap-5">
            {/* Quem acumula os dois papeis troca de area por aqui. Fica FORA dos
                grupos porque não e configuracao — e mudar de contexto. */}
            {isProfessional && (
              <Pressable
                onPress={() => router.replace("/(professional)/queue" as any)}
                accessibilityRole="button"
                className="bg-vupth-greenTint rounded-card py-3.5 px-4 active:opacity-80"
              >
                <View className="flex-row items-center gap-3">
                  {/* Sem equivalente no Pencil (elemento so do app, pra quem
                      acumula os dois papeis) — lucide por consistencia com o
                      resto do menu, já que os outros ícones deixaram de ser
                      Ionicons. */}
                  <ArrowLeftRight size={19} color="#163300" />
                  <Text className="flex-1 font-body text-sm font-semibold text-vupth-forest">
                    Atender como profissional
                  </Text>
                  <ChevronRight size={16} color="#163300" />
                </View>
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
                  badge={solicitacoes}
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
                <>
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
                </>
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
              />
              {/* pix-nas-configuracoes (DEC-65): a chave do dono e a alternativa. */}
              <MenuItem
                icon={QrCode}
                label="Chave Pix (alternativa)"
                hint="vale se o profissional não tiver a dele"
                onPress={() => router.push("/(owner)/pix" as any)}
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
                icon={Palette}
                label="Aparência"
                hint="tema e tamanho da fonte"
                onPress={() =>
                  router.push({ pathname: "/(owner)/aparencia", params: { from: "owner" } } as any)
                }
              />
              <MenuItem
                icon={Info}
                label="Versão do app"
                onPress={() =>
                  router.push({
                    pathname: "/(owner)/sistema",
                    params: { from: "owner" },
                  } as any)
                }
              />
              {/* botao-suporte (PAR-7): abre o site de suporte no navegador. */}
              <MenuItem
                icon={LifeBuoy}
                label="Suporte"
                hint="dúvidas e passo a passo do app"
                onPress={() => abrirSuporte("dono")}
                last
              />
            </Grupo>
  
            {/* Sair da conta fica solto e em vermelho: e a unica acao aqui que
                tira a pessoa do app. */}
            <Pressable
              onPress={handleLogout}
              accessibilityRole="button"
              className="py-2 self-start active:opacity-70"
            >
              <Text className="font-body text-sm font-semibold text-vupth-danger">Sair da conta</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <PilulaVoltarAoTopo visivel={pilula.visivel} onPress={pilula.subir} />
    </View>
  );
}
