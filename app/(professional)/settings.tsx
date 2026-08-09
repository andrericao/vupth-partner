import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { useProfessionalStore } from "@store/professional.store";
import { useAuthStore } from "@store/auth.store";
import { OtaUpdateButton } from "@components/OtaUpdateButton";
import { WsDiagnostics } from "@components/WsDiagnostics";
import { CompletionCard } from "@components/CompletionCard";
import { useProfessionalCompletion } from "@hooks/useProfessionalCompletion";
import { NotificationBadge } from "@components/NotificationBadge";
import { cardShadow } from "@lib/styles";

// Nav v2 etapa 3 (Andre 2026-07-23): "as configuracoes do profissional deve ser
// melhor dividida — dados cadastrais, servicos, refeicoes". Esta tela virou um
// MENU de cards; o conteudo mora nas sub-telas (settings-account, my-services,
// meals, settings-vinculo). Area do dono (dupla role) e Sair vivem aqui — fora
// das Opcoes da fila, que so tem acoes do dia.
type CardProps = {
  title: string;
  hint: string;
  badge?: number;
  dot?: boolean;
  danger?: boolean;
  onPress: () => void;
};

// Escopo de MODULO (licao do segfault do tsc: componente definido dentro do
// componente estourava a inferencia e remonta a subarvore a cada render).
function MenuCard({ title, hint, badge, dot, danger, onPress }: CardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      className="bg-white p-4 rounded-2xl active:bg-gray-50"
      style={cardShadow}
    >
      <View className="flex-row items-center">
        <View className="flex-1">
          <View className="flex-row items-center gap-1">
            <Text className={`font-heading ${danger ? "text-danger-500" : "text-gray-900"}`}>
              {title}
            </Text>
            {/* Dot POR CARD: sem ele o dot da aba dizia "ha pendencia" mas nao
                ONDE (feedback Andre 2026-07-24). Agora acende no card exato. */}
            {dot && (
              <View
                testID={`settings-dot-${title.toLowerCase().replace(/\s+/g, "-")}`}
                style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#E63946" }}
              />
            )}
          </View>
          <Text className="font-body text-xs text-gray-500 mt-0.5">{hint}</Text>
        </View>
        {badge != null && badge > 0 && (
          <NotificationBadge count={badge} testID="settings-badge-invites" />
        )}
        <Text className="font-body text-lg text-gray-400 ml-2">{"\u203A"}</Text>
      </View>
    </Pressable>
  );
}

export default function ProfessionalSettingsScreen() {
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
      className="w-full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 py-12 px-6">
        <Header />

        <Text className="font-heading text-2xl text-gray-900 mt-8">Configuracoes</Text>
        <Text className="font-body text-gray-500 mt-1">
          {[professional?.name, professional?.specialty, professional?.establishment_name]
            .filter(Boolean)
            .join(" · ") || "Complete seu cadastro para atender"}
        </Text>

        {/* Checklist de prontidao (2 completes) mora aqui — a Home so mostra a
            faixa. Encaminha para buscar estabelecimento / adicionar servico. */}
        <CompletionCard
          completion={completion}
          doneBanner="Cadastro completo — já pode atender!"
          routeFor={routeFor}
        />

        <View className="mt-6 gap-3">
          <MenuCard
            title="Dados cadastrais"
            hint="nome, apelido, e-mail, senha"
            dot={dadosDot}
            onPress={() => router.push("/(professional)/settings-account" as any)}
          />
          <MenuCard
            title="Meus servicos"
            hint="precos e duracao do que voce oferece"
            dot={servicosDot}
            onPress={() => router.push("/(professional)/my-services?from=settings" as any)}
          />
          <MenuCard
            title="Refeicoes"
            hint="horarios + aviso na hora (ligar/desligar)"
            onPress={() => router.push("/(professional)/meals?from=settings" as any)}
          />
          <MenuCard
            title="Vinculo"
            hint={professional?.establishment_name ?? "nao vinculado — buscar estabelecimento"}
            badge={pendingInvites}
            dot={vinculoDot}
            onPress={() => router.push("/(professional)/settings-vinculo" as any)}
          />
          {/* TEMPORARIO — piloto da migracao Gluestack v2 (NativeWind). Remover
              quando concluir a migracao (junto com nativewind-pilot.tsx). */}
          <MenuCard
            title="🧪 Piloto NativeWind"
            hint="teste da migracao Gluestack v2 (temporario)"
            onPress={() => router.push("/(professional)/nativewind-pilot" as any)}
          />
          {isOwner && (
            <MenuCard
              title="Area do dono"
              hint="gerenciar o estabelecimento"
              onPress={() => router.replace("/(owner)/dashboard" as any)}
            />
          )}
          <MenuCard title="Sair" hint="encerrar a sessao neste aparelho" danger onPress={handleLogout} />

          <OtaUpdateButton />
          {/* QA de device do WebSocket (2026-08-05): os logs sao gated por
              __DEV__ e o QA roda em bundle de OTA, entao o dado sai por aqui. */}
          <WsDiagnostics />
        </View>
      </View>
    </ScrollView>
  );
}
