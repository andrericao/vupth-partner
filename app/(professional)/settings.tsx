import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Scissors,
  Utensils,
  User,
  Link as LinkIcon,
  ChevronRight,
  ArrowLeftRight,
  Info,
} from "lucide-react-native";
import type { ComponentType, ReactNode } from "react";
import { useProfessionalStore } from "@store/professional.store";
import { useAuthStore } from "@store/auth.store";
import { CompletionCard } from "@components/CompletionCard";
import { useProfessionalCompletion } from "@hooks/useProfessionalCompletion";
import { NotificationBadge } from "@components/NotificationBadge";
import { confirmar } from "@lib/confirmar";

// Nav v2 etapa 3 (Andre 2026-07-23): "as configuracoes do profissional deve ser
// melhor dividida — dados cadastrais, servicos, refeicoes". Esta tela virou um
// MENU de cards; o conteudo mora nas sub-telas (settings-account, my-services,
// meals, settings-vinculo). Area do dono (dupla role) e Sair vivem aqui — fora
// das Opcoes da fila, que so tem acoes do dia.
//
// [marca-vupth] Redesenhada p/ bater com o Pencil (PROF · 04 Perfil): cabecalho
// proprio (forest + avatar + nome), sem o Header padrao (o .pen nao tem a barra
// VUPTH/icone de papel nesta tela — o avatar+nome ja cumpre esse papel), e o
// menu ganhou icone + agrupamento (ATENDIMENTO / CONTA) no lugar da lista lisa
// com "›" de texto.
type CardProps = {
  icon: ComponentType<{ size?: number; color?: string }>;
  title: string;
  hint: string;
  badge?: number;
  dot?: boolean;
  last?: boolean;
  onPress: () => void;
};

function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Escopo de MODULO (licao do segfault do tsc: componente definido dentro do
// componente estourava a inferencia e remonta a subarvore a cada render).
function MenuCard({ icon: Icon, title, hint, badge, dot, last = false, onPress }: CardProps) {
  return (
    <>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        className="flex-row items-center gap-3 px-4 py-3.5 active:bg-vupth-surface"
      >
        <Icon size={19} color="#163300" />
        <View className="flex-1">
          <View className="flex-row items-center gap-1">
            <Text className="font-body text-sm font-semibold text-vupth-forest">{title}</Text>
            {/* Dot POR CARD: sem ele o dot da aba dizia "ha pendência" mas nao
                ONDE (feedback Andre 2026-07-24). Agora acende no card exato. */}
            {dot && (
              <View
                testID={`settings-dot-${title.toLowerCase().replace(/\s+/g, "-")}`}
                className="w-2 h-2 rounded-full bg-vupth-danger"
              />
            )}
          </View>
          <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">{hint}</Text>
        </View>
        {badge != null && badge > 0 && (
          <NotificationBadge count={badge} testID="settings-badge-invites" />
        )}
        <ChevronRight size={16} color="#454745" />
      </Pressable>
      {!last && <View className="h-px bg-vupth-border" />}
    </>
  );
}

/** Bloco de cards sob um rotulo — mesmo padrao do menu do dono (menu.tsx). */
function Grupo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="font-body text-[11px] font-bold tracking-wider text-vupth-textSecondary">
        {label.toUpperCase()}
      </Text>
      <View className="bg-vupth-surface rounded-card overflow-hidden">{children}</View>
    </View>
  );
}

export default function ProfessionalSettingsScreen() {
  const insets = useSafeAreaInsets();
  const professional = useProfessionalStore((s) => s.professional);
  const fetchMyAffiliations = useProfessionalStore((s) => s.fetchMyAffiliations);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { completion, routeFor } = useProfessionalCompletion();

  const isOwner = user?.roles?.includes("OWNER");

  // Mapeia as pendencias do checklist para o CARD exato (feedback Andre
  // 2026-07-24: a aba tinha dot, mas dentro nao dava pra saber O QUE faltava).
  const pendingKeys = new Set(
    [...completion.basic.items, ...completion.profile.items]
      .filter((i) => !i.done)
      .map((i) => i.key)
  );
  const dadosDot = pendingKeys.has("nickname") || pendingKeys.has("specialty");
  const servicosDot = pendingKeys.has("service");
  const vinculoDot = pendingKeys.has("affiliated");

  // Contagem de convites pendentes: o conteudo mora em settings-vinculo, mas o
  // badge aqui evita que um convite do owner fique enterrado um nivel abaixo.
  const [pendingInvites, setPendingInvites] = useState(0);

  const loadInvites = useCallback(async () => {
    try {
      const all = await fetchMyAffiliations();
      setPendingInvites(
        (all ?? []).filter((a: any) => a.status === "PENDING" && a.type === "INVITATION").length
      );
    } catch {}
  }, [fetchMyAffiliations]);

  useEffect(() => {
    // carrega a contagem on-mount; setPendingInvites e o efeito desejado do fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInvites();
  }, [loadInvites]);

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

  const subtitle =
    [professional?.specialty, professional?.establishment_name].filter(Boolean).join(" · ") ||
    "Complete seu cadastro para atender";

  return (
    <ScrollView className="w-full" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      {/* [marca-vupth] Cabecalho proprio (Pencil PROF · 04): forest + avatar
          com iniciais + nome. Substitui o Header padrao nesta tela — o .pen
          não repete a barra VUPTH/icone de papel aqui, o avatar já identifica
          quem esta logado. */}
      <View
        className="bg-vupth-forest items-center px-4 pb-7"
        style={{ paddingTop: insets.top + 24 }}
      >
        <View className="w-[72px] h-[72px] rounded-full bg-vupth-green items-center justify-center">
          <Text className="font-display text-2xl text-vupth-forest">
            {initials(professional?.name)}
          </Text>
        </View>
        <Text className="font-display text-xl text-white mt-3">
          {professional?.name ?? "Profissional"}
        </Text>
        <Text className="font-body text-sm text-vupth-green mt-0.5">{subtitle}</Text>
      </View>

      <View className="flex-1 py-6 px-4 gap-5">
        {/* Checklist de prontidao (2 completes) mora aqui — a Home so mostra a
            faixa. Encaminha para buscar estabelecimento / adicionar serviço. */}
        <CompletionCard
          completion={completion}
          doneBanner="Cadastro completo — já pode atender!"
          routeFor={routeFor}
        />

        {/* Quem acumula os dois papeis troca de area por aqui — mesmo padrao
            do menu do dono (menu.tsx "Atender como profissional"). Fica FORA
            dos grupos porque não e configuracao, e mudar de contexto. */}
        {isOwner && (
          <Pressable
            onPress={() => router.replace("/(owner)/dashboard" as any)}
            className="flex-row items-center gap-3 bg-vupth-greenTint rounded-card px-4 py-3.5"
          >
            <ArrowLeftRight size={19} color="#163300" />
            <Text className="flex-1 font-body text-sm font-semibold text-vupth-forest">
              Área do dono
            </Text>
            <ChevronRight size={16} color="#163300" />
          </Pressable>
        )}

        <Grupo label="Atendimento">
          <MenuCard
            icon={Scissors}
            title="Meus serviços"
            hint="preços e duração do que você oferece"
            dot={servicosDot}
            onPress={() => router.push("/(professional)/my-services?from=settings" as any)}
          />
          <MenuCard
            icon={Utensils}
            title="Refeições"
            hint="horários + aviso na hora (ligar/desligar)"
            last
            onPress={() => router.push("/(professional)/meals?from=settings" as any)}
          />
        </Grupo>

        <Grupo label="Conta">
          <MenuCard
            icon={User}
            title="Dados cadastrais"
            hint="nome, apelido, e-mail, senha"
            dot={dadosDot}
            onPress={() => router.push("/(professional)/settings-account" as any)}
          />
          <MenuCard
            icon={LinkIcon}
            title="Vínculo"
            hint={professional?.establishment_name ?? "não vinculado — buscar estabelecimento"}
            badge={pendingInvites}
            dot={vinculoDot}
            last
            onPress={() => router.push("/(professional)/settings-vinculo" as any)}
          />
        </Grupo>

        {/* Sair da conta fica solto e em vermelho, fora dos grupos: e a unica
            ação aqui que tira a pessoa do app (Pencil PROF · 04, mesmo padrao
            do menu do dono). */}
        <Pressable onPress={handleLogout} className="py-1" accessibilityRole="button" accessibilityLabel="Sair">
          <Text className="font-body text-sm font-semibold text-vupth-danger text-center">
            Sair da conta
          </Text>
        </Pressable>

        {/* Versao, atualizacao e diagnostico saem do RODAPE e viram destino
            (pedido dele, 09/09: "estao sujando a tela para o usuario"). Quem
            precisa, entra; quem nao precisa, nem sabe que existe. */}
        <Grupo label="Sistema">
          <MenuCard
            icon={Info}
            title="Versão do app"
            hint="atualização e informações técnicas"
            last
            onPress={() => router.push("/(professional)/sistema" as any)}
          />
        </Grupo>
      </View>
    </ScrollView>
  );
}
