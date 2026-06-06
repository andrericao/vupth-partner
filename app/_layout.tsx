import { StatusBar, LogBox } from "react-native";
import { Slot } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@lib/queryClient";
import { SafeAreaProvider } from "react-native-safe-area-context";

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

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <GluestackUIProvider config={config}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="#F7FAF8"
          />
          {fontLoaded ? <Slot /> : <Loading />}
        </GluestackUIProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
