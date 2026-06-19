import { useEffect } from "react";
import { LogBox, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Slot } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@lib/queryClient";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";

LogBox.ignoreLogs(["Invalid prop `fill` supplied to `React.Fragment`"]);
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

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#FFFFFF");
      NavigationBar.setButtonStyleAsync("dark");
    }
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <GluestackUIProvider config={config}>
          {/* expo-status-bar e mais confiavel que o StatusBar do RN no Expo:
              style="dark" = icones escuros (visiveis sobre fundo claro). Aplica
              em todas as telas (fundo do app e claro #F7FAF8). */}
          <StatusBar style="dark" backgroundColor="#F7FAF8" />
          {fontLoaded ? <Slot /> : <Loading />}
        </GluestackUIProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
