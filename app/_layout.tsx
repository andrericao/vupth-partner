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
import {
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Loading } from "@components/Loading";

export default function RootLayout() {
  // [new-design] Guia: Poppins p/ titulos/botoes, Inter p/ texto.
  const [fontLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#FFFFFF");
      NavigationBar.setButtonStyleAsync("dark");
    }
  }, []);

  return (
    // [new-design] Fundo off-white do guia (#F7FAF8) em todo o app — telas sem
    // bg proprio herdam, e os cards brancos passam a "saltar" sobre ele.
    <SafeAreaProvider style={{ flex: 1, backgroundColor: "#F7FAF8" }}>
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
