import { Tabs } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabBarIcon, tabBarShadow } from "@components/TabBarIcon";
import { useProfessionalCompletion } from "@hooks/useProfessionalCompletion";
import { hasAnyPending } from "@lib/completion";

// Nav v2 (Andre 2026-07-23, mockup design/professional-nav-v2.html):
// RODAPE = LUGARES — Fila · Relatorios · Configuracoes. As ACOES do dia vivem na
// tela "Opcoes da fila" (banco no header da Fila), SEM duplicar o rodape.
// A aba Configuracoes ganha DOT quando ha pendencia de cadastro.
const HIDDEN = { href: null } as const;

export default function ProfessionalLayout() {
  const insets = useSafeAreaInsets();
  const { completion } = useProfessionalCompletion();
  const settingsDot = hasAnyPending(completion);

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
          fontSize: 12,
          lineHeight: 16,
        },
      }}
    >
      <Tabs.Screen
        name="queue"
        options={{
          title: "Fila",
          tabBarIcon: ({ focused }) => <TabBarIcon name="people" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="my-day"
        options={{
          title: "Relatorios",
          tabBarIcon: ({ focused }) => <TabBarIcon name="stats-chart" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Configuracoes",
          tabBarIcon: ({ focused }) => (
            <View>
              <TabBarIcon name="settings" focused={focused} />
              {settingsDot && (
                <View
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -4,
                    width: 9,
                    height: 9,
                    borderRadius: 5,
                    backgroundColor: "#E63946",
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen name="queue-options" options={HIDDEN} />
      <Tabs.Screen name="cut-requests" options={HIDDEN} />
      <Tabs.Screen name="settings-account" options={HIDDEN} />
      <Tabs.Screen name="settings-vinculo" options={HIDDEN} />
      <Tabs.Screen name="my-services" options={HIDDEN} />
      <Tabs.Screen name="onboarding" options={HIDDEN} />
      <Tabs.Screen name="add-guest" options={HIDDEN} />
      <Tabs.Screen name="find-establishment" options={HIDDEN} />
      <Tabs.Screen name="establishment-detail" options={HIDDEN} />
      <Tabs.Screen name="meals" options={HIDDEN} />
      {/* PILOTO Gluestack v2 (NativeWind) — rota temporaria, remover ao concluir */}
      <Tabs.Screen name="nativewind-pilot" options={HIDDEN} />
    </Tabs>
  );
}
