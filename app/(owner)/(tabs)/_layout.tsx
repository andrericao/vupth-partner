import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabBarIcon, tabBarShadow } from "@components/TabBarIcon";

export default function OwnerTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#163300", // [marca-vupth] $forest
        tabBarInactiveTintColor: "#454745", // $text-secondary
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
          fontSize: 12,
          lineHeight: 16,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Início",
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
          tabBarIcon: ({ focused }) => <TabBarIcon name="queues" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "Menu",
          tabBarIcon: ({ focused }) => <TabBarIcon name="menu" focused={focused} />,
        }}
      />
      <Tabs.Screen name="add-professional" options={{ href: null }} />
      <Tabs.Screen name="add-service" options={{ href: null }} />
      <Tabs.Screen name="affiliations" options={{ href: null }} />
      <Tabs.Screen name="attendances" options={{ href: null }} />
      <Tabs.Screen name="professional-queue" options={{ href: null }} />
      <Tabs.Screen name="coming-soon" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="establishment-data" options={{ href: null }} />
      <Tabs.Screen name="establishment-registration" options={{ href: null }} />
      <Tabs.Screen name="establishment-hours" options={{ href: null }} />
      <Tabs.Screen name="invite-professional" options={{ href: null }} />
    </Tabs>
  );
}
