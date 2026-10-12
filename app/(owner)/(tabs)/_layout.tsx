import { Tabs } from "expo-router";
import { useFs } from "@store/fonte.store";
import { View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabBarIcon, tabBarShadow } from "@components/TabBarIcon";
import { rotulosCabem } from "@lib/rotulosDaAba";
import { NotificationBadge } from "@components/NotificationBadge";
import { useEstablishmentStore } from "@store/establishment.store";
import { useSolicitacoesDeVinculo } from "@hooks/useSolicitacoesDeVinculo";

export default function OwnerTabsLayout() {
  const fs = useFs();
  const insets = useSafeAreaInsets();
  // DS4 — a barra NAO cresce: quando o rotulo deixa de caber, ele SAI e fica
  // o icone. So funciona porque a pilula do DS5.1 marca a aba ativa sem ele.
  // O dono aguenta mais que o profissional: tres rotulos curtos, nao quatro.
  const { width, fontScale } = useWindowDimensions();
  const mostrarRotulo = rotulosCabem(width, fontScale, "dono");
  // Solicitacao de vinculo parada (Andre, 25/09: "nenhum dot aponta para
  // ela"). O numero sobe ate a aba porque o dono vive no Inicio, nao no Menu.
  const establishmentId = useEstablishmentStore((s) => s.establishment?.id);
  const solicitacoes = useSolicitacoesDeVinculo(establishmentId);

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
          height: 72 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_400Regular",
          fontSize: fs(12),
          lineHeight: fs(16),
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Início",
          tabBarButtonTestID: "aba-inicio",
          tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} />,
        }}
      />
      {/* Filas vira ABA (Pencil OWNER): era um item no meio do menu e um botao
          ambar no dashboard, sendo a tela que o dono mais abre depois do
          Inicio. A frequencia de uso e que decide o rodape, não a categoria. */}
      <Tabs.Screen
        name="queues"
        options={{
          title: "Filas",
          tabBarButtonTestID: "aba-filas",
          tabBarIcon: ({ focused }) => <TabBarIcon name="queues" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "Menu",
          tabBarButtonTestID: "aba-menu",
          tabBarIcon: ({ focused }) => (
            <View>
              <TabBarIcon name="menu" focused={focused} />
              <View style={{ position: "absolute", top: -6, right: -12 }}>
                <NotificationBadge count={solicitacoes} testID="tab-badge-menu" />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen name="add-professional" options={{ href: null }} />
      <Tabs.Screen name="affiliations" options={{ href: null }} />
      <Tabs.Screen name="attendances" options={{ href: null }} />
      <Tabs.Screen name="professional-queue" options={{ href: null }} />
      <Tabs.Screen name="coming-soon" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="establishment-data" options={{ href: null }} />
      <Tabs.Screen name="establishment-registration" options={{ href: null }} />
      <Tabs.Screen name="establishment-hours" options={{ href: null }} />
      <Tabs.Screen name="invite-professional" options={{ href: null }} />
      <Tabs.Screen name="passar-posse" options={{ href: null }} />
      <Tabs.Screen name="sistema" options={{ href: null }} />
      <Tabs.Screen name="aparencia" options={{ href: null }} />
    </Tabs>
  );
}
