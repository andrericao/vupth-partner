import { Tabs } from "expo-router";
import { fs } from "@store/fonte.store";
import { View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { rotulosCabem } from "@lib/rotulosDaAba";
import { TabBarIcon, tabBarShadow } from "@components/TabBarIcon";
import { NotificationBadge } from "@components/NotificationBadge";
import { useProfessionalCompletion } from "@hooks/useProfessionalCompletion";
import { usePendingCutRequests } from "@hooks/usePendingCutRequests";
import { hasAnyPending } from "@lib/completion";

// RODAPE = LUGARES. Quatro abas, como o Pencil desenha em `Tab Bar Professional`:
// Fila · Encaixes · Relatórios · Perfil.
//
// [marca-vupth] ENCAIXES virou ABA (correcao, 2026-08-21). Ela era rota OCULTA,
// alcancavel so por Fila -> Opcoes da fila -> Solicitacoes, e a linha de
// Solicitacoes so aparece QUANDO ja existe pedido. Isso nao e so divergencia de
// desenho: o pedido de encaixe EXPIRA EM 5 MINUTOS (auto-negado server-side).
// Enterrado dois niveis abaixo, o profissional podia simplesmente nao ver a
// tempo — e quem perde e o cliente, que fica sem resposta. Como aba com badge,
// a pendencia fica visivel de qualquer lugar do app.
//
// Mesma logica que ja tinha promovido `queues` no rodape do DONO: quem decide o
// rodape e a frequencia/urgencia de uso, nao a categoria.
//
// As ACOES do dia seguem em "Opcoes da fila" (banco no header da Fila), sem
// duplicar o rodape.
const HIDDEN = { href: null } as const;

export default function ProfessionalLayout() {
  const insets = useSafeAreaInsets();
  // DS4 — a barra NAO cresce: quando o rotulo deixa de caber, ele SAI e fica
  // o icone (o que iOS e Android fazem). So funciona porque a pilula do DS5.1
  // marca a aba ativa sem o rotulo. Ver `rotulosCabem`.
  const { width, fontScale } = useWindowDimensions();
  const mostrarRotulo = rotulosCabem(width, fontScale, "profissional");
  const { completion } = useProfessionalCompletion();
  const perfilDot = hasAnyPending(completion);
  const { count: encaixes } = usePendingCutRequests();

  return (
    <Tabs
      // Voltar = a aba visitada ANTES, e nao a primeira (Andre, 24/09: na web,
      // o voltar da tela Sistema caia na Fila). O padrao do React Navigation e
      // "firstRoute", e as telas ocultas daqui (Sistema, Dados cadastrais, Meus
      // Servicos...) sao ABAS — pelo historico, todas voltavam ao inicio.
      // Travado em voltarNasAbas.test.ts.
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#163300", // [marca-vupth] $forest
        tabBarInactiveTintColor: "#454745", // $text-secondary
        // Rotulo SEMPRE embaixo do icone. Sem isto o React Navigation decide
        // sozinho e, faltando altura, joga o rotulo AO LADO — que com a pilula
        // (larga) cai por cima do icone. Aconteceu no app do cliente em
        // 2026-08-26; aqui ha folga (56 de conteudo pra 45 de pilula+rotulo),
        // mas a folga some se alguem crescer o icone ou a fonte.
        tabBarLabelPosition: "below-icon",
        tabBarShowLabel: mostrarRotulo,
        tabBarStyle: {
          ...tabBarShadow,
          backgroundColor: "#FFFFFF",
          borderTopColor: "#D7DDD3", // [marca-vupth] $brandBorder
          borderTopWidth: 0,
          // [marca-vupth] Rotulo cortado em device real (QA Alexia 2026-08-21):
          // 60 - 8(top) - 8(bottom) sobrava so 44px pro icone (24) + label —
          // sem folga, cortava embaixo dependendo do metrics da fonte. +12px.
          // Mesmo ajuste em (owner)/(tabs)/_layout.tsx (formula identica).
          height: 72 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_400Regular",
          fontSize: fs(11),
          lineHeight: 15,
        },
      }}
    >
      <Tabs.Screen
        name="queue"
        options={{
          title: "Fila",
          tabBarButtonTestID: "aba-fila",
          tabBarIcon: ({ focused }) => <TabBarIcon name="queue" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cut-requests"
        options={{
          title: "Encaixes",
          tabBarButtonTestID: "aba-encaixes",
          tabBarIcon: ({ focused }) => (
            <View>
              <TabBarIcon name="fits" focused={focused} />
              {/* Badge com CONTAGEM (nao dot): o Pencil desenha o numero, e
                  aqui ele importa — sao pedidos distintos, cada um com o seu
                  relogio de 5min correndo. */}
              <View style={{ position: "absolute", top: -6, right: -12 }}>
                <NotificationBadge count={encaixes} testID="tab-badge-encaixes" />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="my-day"
        options={{
          title: "Relatórios",
          tabBarButtonTestID: "aba-relatorios",
          tabBarIcon: ({ focused }) => <TabBarIcon name="reports" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          // Pencil chama de "Perfil" (era "Configuracoes", sem acento). A tela
          // de destino ja e o perfil: avatar, nome e vinculo no topo.
          title: "Perfil",
          tabBarButtonTestID: "aba-perfil",
          tabBarIcon: ({ focused }) => (
            <View>
              <TabBarIcon name="profile" focused={focused} />
              {perfilDot && (
                <View
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -4,
                    width: 9,
                    height: 9,
                    borderRadius: 5,
                    backgroundColor: "#B3261E", // [marca-vupth] $brandDanger
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen name="queue-options" options={HIDDEN} />
      <Tabs.Screen name="settings-account" options={HIDDEN} />
      <Tabs.Screen name="settings-vinculo" options={HIDDEN} />
      <Tabs.Screen name="my-services" options={HIDDEN} />
      <Tabs.Screen name="onboarding" options={HIDDEN} />
      <Tabs.Screen name="add-guest" options={HIDDEN} />
      <Tabs.Screen name="find-establishment" options={HIDDEN} />
      <Tabs.Screen name="establishment-detail" options={HIDDEN} />
      <Tabs.Screen name="meals" options={HIDDEN} />
      {/* ⚠️ SEM esta linha a tela vira ABA. O expo-router registra como aba
          toda tela da pasta que o layout nao declara — e era o unico arquivo
          aqui que ninguem tinha declarado. O diagnostico do WebSocket mora
          atras dos 7 toques na versao (em Perfil), nao no rodape: rodape e
          para o trabalho do dia, e um profissional nao tem o que fazer ali.
          Relatado pelo Andre no teste de 14/09. */}
      <Tabs.Screen name="sistema" options={HIDDEN} />
      {/* PILOTO Gluestack v2 (NativeWind) — rota temporaria, remover ao concluir */}
    </Tabs>
  );
}
