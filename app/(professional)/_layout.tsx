import { Tabs } from "expo-router";
import { Text } from "@gluestack-ui/themed";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfessionalLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#00B37E",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
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
        name="queue"
        options={{
          title: "Fila",
          tabBarIcon: ({ color }) => (
            <Text fontSize="$xl" color={color}>&#9776;</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="my-services"
        options={{
          title: "Servicos",
          tabBarIcon: ({ color }) => (
            <Text fontSize="$xl" color={color}>&#9733;</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <Text fontSize="$xl" color={color}>&#9881;</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="onboarding"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="attendances"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="reports"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="settings"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="add-guest"
        options={{ href: null }}
      />
    </Tabs>
  );
}
