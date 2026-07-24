import { useState, useEffect, useCallback } from "react";
import { VStack, HStack, Heading, Text, ScrollView, Pressable } from "@gluestack-ui/themed";
import { Alert, View } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { useProfessionalStore } from "@store/professional.store";
import { useAuthStore } from "@store/auth.store";
import { OtaUpdateButton } from "@components/OtaUpdateButton";
import { CompletionCard } from "@components/CompletionCard";
import { useProfessionalCompletion } from "@hooks/useProfessionalCompletion";
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
// componente estoura a inferencia do gluestack e remonta a subarvore).
function MenuCard({ title, hint, badge, dot, danger, onPress }: CardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      bg="$white"
      p="$4"
      borderRadius="$2xl"
      $active-bg="$coolGray50"
      style={cardShadow}
    >
      <HStack alignItems="center">
        <VStack flex={1}>
          <HStack alignItems="center" space="xs">
            <Text fontFamily="$heading" fontWeight="$bold" color={danger ? "$red500" : "$coolGray900"}>
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
          </HStack>
          <Text fontFamily="$body" fontSize="$xs" color="$coolGray500" mt="$0.5">
            {hint}
          </Text>
        </VStack>
        {badge != null && badge > 0 && (
          <VStack
            testID="settings-badge-invites"
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
        <Text fontFamily="$body" fontSize="$lg" color="$coolGray400" ml="$2">
          {"›"}
        </Text>
      </HStack>
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
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack flex={1} py="$12" px="$6">
        <Header />

        <Heading mt="$8" size="2xl" fontFamily="$heading">
          Configuracoes
        </Heading>
        <Text fontFamily="$body" color="$coolGray500" mt="$1">
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

        <VStack mt="$6" space="md">
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
            onPress={() => router.push("/(professional)/my-services" as any)}
          />
          <MenuCard
            title="Refeicoes"
            hint="horarios + aviso na hora (ligar/desligar)"
            onPress={() => router.push("/(professional)/meals" as any)}
          />
          <MenuCard
            title="Vinculo"
            hint={professional?.establishment_name ?? "nao vinculado — buscar estabelecimento"}
            badge={pendingInvites}
            dot={vinculoDot}
            onPress={() => router.push("/(professional)/settings-vinculo" as any)}
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
        </VStack>
      </VStack>
    </ScrollView>
  );
}
