import { useState } from "react";

import { LinksLegais } from "@components/LinksLegais";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useVoltarAoTopo, usePilulaTopo } from "@hooks/useVoltarAoTopo";
import { PilulaVoltarAoTopo } from "@components/PilulaVoltarAoTopo";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { useEstablishmentStore } from "@store/establishment.store";
import { useProfessionalStore } from "@store/professional.store";
import { useAuthStore } from "@store/auth.store";
import { PendingDot } from "@components/PendingDot";
import { DotNoCanto } from "@components/DotNoCanto";
import { NotificationBadge } from "@components/NotificationBadge";
import { useOwnerCompletion } from "@hooks/useOwnerCompletion";
import { useSolicitacoesDeVinculo } from "@hooks/useSolicitacoesDeVinculo";
import { hasAnyPending } from "@lib/completion";
import { serviceTypeLabel } from "@lib/serviceTypes";
import { Users, ClipboardList, ChartColumn, Store, User, LogOut, ChevronRight, ArrowLeftRight, Palette,
  Info, LifeBuoy, QrCode, Ticket, Check, Plus,
  Bug,
} from "lucide-react-native";
import type { ComponentType } from "react";
import { confirmar } from "@lib/confirmar";
import { abrirSuporte } from "@lib/suporte";
import { sentryLigado } from "@lib/sentry";
import { ReportarProblema } from "@components/ReportarProblema";
import { CUPOM_NO_AR } from "@lib/campanhas";
import { podeAdicionarLoja } from "@lib/multiLoja";
import { useTema } from "@hooks/useTema";

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
  const { cores } = useTema();
  return (
    <>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        className="flex-row items-center gap-3 px-4 py-3.5 active:bg-vupth-greenTint"
      >
        <Icon size={19} color={cores.textPrimary} />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-body text-sm font-semibold text-vupth-textPrimary">{label}</Text>
          </View>
          {hint && (
            <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">{hint}</Text>
          )}
        </View>
        {/* dot-no-canto-do-card: canto superior direito do card, nao ao lado do nome. */}
        {dot && (
          <DotNoCanto dentro testID={`menu-dot-${label.toLowerCase().replace(/\s+/g, "-")}`}>
            <PendingDot />
          </DotNoCanto>
        )}
        {/* O mesmo badge das Configuracoes do profissional (1..9, depois "9+"). */}
        {badge != null && badge > 0 && (
          <NotificationBadge count={badge} testID={`menu-badge-${label.toLowerCase()}`} />
        )}
        <ChevronRight size={16} color={cores.textSecondary} />
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
  const { cores } = useTema();
  // Tocar na aba JA ATIVA volta ao topo (Andre, 18/09).
  const rolagemRef = useVoltarAoTopo();
  const [reportando, setReportando] = useState(false);
  const pilula = usePilulaTopo(rolagemRef);

  const establishment = useEstablishmentStore((s) => s.establishment);
  const lojas = useEstablishmentStore((s) => s.lojas);
  const selecionarLoja = useEstablishmentStore((s) => s.selecionarLoja);
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
      titulo: "Sair da loja",
      mensagem: "Você será desvinculado deste estabelecimento. Deseja continuar?",
      confirmar: "Sair da loja",
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
      titulo: "Sair da conta",
      mensagem: "",
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
                  <ArrowLeftRight size={19} color={cores.onGreenTint} />
                  <Text className="flex-1 font-body text-sm font-semibold text-vupth-onGreenTint">
                    Atender como profissional
                  </Text>
                  <ChevronRight size={16} color={cores.onGreenTint} />
                </View>
              </Pressable>
            )}
  
            {establishment?.id && (
              <Grupo label={lojas.length > 1 ? "SUAS LOJAS" : "LOJA"}>
                {/* Seletor de loja (multi-loja-do-dono): a ativa leva o check. */}
                {lojas.length > 1 &&
                  lojas.map((l) => (
                    <MenuItem
                      key={l.id}
                      icon={l.id === establishment.id ? Check : Store}
                      label={l.name}
                      onPress={() => selecionarLoja(l.id)}
                    />
                  ))}
                {podeAdicionarLoja(lojas.length) && (
                  <MenuItem
                    icon={Plus}
                    label="Adicionar outra loja"
                    onPress={() => router.push("/(owner)/nova-loja" as any)}
                    last
                  />
                )}
              </Grupo>
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
              {/* cupom-no-app (DEC-61): liga quando o Backend das campanhas subir. */}
              {CUPOM_NO_AR && (
                <MenuItem
                  icon={Ticket}
                  label="Promoções"
                  hint="usar um cupom"
                  onPress={() => router.push("/(owner)/promocoes?from=owner" as any)}
                />
              )}
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
                  label="Sair da loja"
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
                last={!sentryLigado()}
              />
              {/* sentry-feedback-do-usuario: so com o Sentry ligado no binario. */}
              {sentryLigado() && (
                <MenuItem
                  icon={Bug}
                  label="Reportar problema"
                  hint="conte o que deu errado"
                  onPress={() => setReportando(true)}
                  last
                />
              )}
            </Grupo>
  
            {/* Sair da conta fica solto e em vermelho: e a unica acao aqui que
                tira a pessoa do app. */}
            <Pressable
              onPress={handleLogout}
              accessibilityRole="button"
              className="py-2 self-center active:opacity-70"
            >
              <Text className="font-body text-sm font-semibold text-vupth-danger text-center">Sair da conta</Text>
            </Pressable>
            <LinksLegais className="mt-2" />
          </View>
        </View>
      </ScrollView>
      <PilulaVoltarAoTopo visivel={pilula.visivel} onPress={pilula.subir} />
      <ReportarProblema visivel={reportando} onFechar={() => setReportando(false)} />
    </View>
  );
}
