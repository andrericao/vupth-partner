import { useEffect } from "react";
import { StatusBar } from "react-native";
import { Slot } from "expo-router";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { config } from "../config/gluestack-ui.config";
import {
  useFonts,
  Inter_400Regular,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { Loading } from "@components/Loading";

export default function RootLayout() {
  const [fontLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });

  if (!fontLoaded) {
    return <Loading />;
  }

  return (
    <GluestackUIProvider config={config}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <Slot />
    </GluestackUIProvider>
  );
}
