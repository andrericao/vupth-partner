import { View, ActivityIndicator } from "react-native";
import { useTema } from "@hooks/useTema";

// Spinner centralizado. Migrado p/ NativeWind (v2).
export function Loading() {
  const { cores } = useTema();
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color={cores.textPrimary} />
    </View>
  );
}
