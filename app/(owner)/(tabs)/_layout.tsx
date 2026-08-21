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
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          ...tabBarShadow,
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          borderTopWidth: 0,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_400Regular",
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} />,
        }}
      />
      {/* Filas vira ABA (Pencil OWNER): era um item no meio do menu e um botao
          ambar no dashboard, sendo a tela que o dono mais abre depois do
          Inicio. A frequencia de uso e que decide o rodape, nao a categoria. */}
      <Tabs.Screen
        name="queues"
        options={{
          title: "Filas",
          tabBarIcon: ({ focused }) => <TabBarIcon name="people" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "Menu",
          tabBarIcon: ({ focused }) => <TabBarIcon name="apps" focused={focused} />,
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
