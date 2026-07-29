import { View, ActivityIndicator } from "react-native";

// Spinner centralizado. Migrado p/ NativeWind (v2).
export function Loading() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#3b7a3f" />
    </View>
  );
}
