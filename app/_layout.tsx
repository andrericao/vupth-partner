import "../global.css"; // NativeWind (Gluestack v2): habilita as classes Tailwind
import { useEffect } from "react";
import { LogBox, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Slot } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@lib/queryClient";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import * as NavigationBar from "expo-navigation-bar";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { config } from "../config/gluestack-ui.config";
// ⚠️ As fontes vem de `assets/fonts/`, NAO de `@expo-google-fonts`.
// A Cloudflare Pages EXCLUI `node_modules` do deploy, por design — e o
// `expo export --platform web` grava os assets espelhando o caminho de origem,
// entao os TTFs saiam em `dist/assets/node_modules/@expo-google-fonts/...` e
// eram descartados em silencio. O app publicado ficava num spinner eterno
// (2026-08-27). Travado por teste em `brandTokens.test.ts`.
import { useFonts } from "expo-font";
import { Loading } from "@components/Loading";
import { usePushRegistration } from "@hooks/usePushRegistration";

LogBox.ignoreLogs(["Invalid prop `fill` supplied to `React.Fragment`"]);

// [marca-vupth] O fundo das telas vinha do DEFAULT do React Navigation —
// `rgb(242,242,242)` (#F2F2F2), que nao e cor nenhuma da marca. Medido no
// device web: pagina #F2F2F2 contra card #F3F5F1 ($brandSurface). Dois pontos
// de diferenca por canal: visualmente indistinguiveis, e foi por isso que os
// cards "sumiram" quando tiramos a sombra deles — nao era a sombra que fazia
// falta, era o fundo estar errado.
//
// O `backgroundColor` do SafeAreaProvider nao resolvia: ele fica ATRAS do
// navegador, entao o cinza do tema cobria por cima. O client ja fazia isso
// certo (src/routes/index.tsx tem tema custom desde sempre) — o partner era o
// unico sem, porque o Expo Router monta o navegador sem ThemeProvider.
const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "#FFFFFF" }, // $brandBackground
};

export default function RootLayout() {
  // [marca-vupth] Archivo substitui Poppins em titulos/botoes; Inter segue no
  // corpo. Poppins segue carregado ate as telas v1 migrarem.
  const [fontLoaded, fontError] = useFonts({
    Inter_400Regular: require("../assets/fonts/Inter_400Regular.ttf"),
    Inter_700Bold: require("../assets/fonts/Inter_700Bold.ttf"),
    Poppins_500Medium: require("../assets/fonts/Poppins_500Medium.ttf"),
    Poppins_600SemiBold: require("../assets/fonts/Poppins_600SemiBold.ttf"),
    Poppins_700Bold: require("../assets/fonts/Poppins_700Bold.ttf"),
    Archivo_700Bold: require("../assets/fonts/Archivo_700Bold.ttf"),
    Archivo_800ExtraBold: require("../assets/fonts/Archivo_800ExtraBold.ttf"),
    DMMono_500Medium: require("../assets/fonts/DMMono_500Medium.ttf"),
  });

  // Push: registra o device quando autenticado e trata o toque na notificacao.
  usePushRegistration();

  useEffect(() => {
    if (Platform.OS === "android") {
      // Com edge-to-edge, setBackgroundColorAsync nao e suportado (vira no-op e
      // emite warning) — a cor da barra fica por conta do sistema. Mantemos so
      // o estilo dos botoes (icones escuros).
      NavigationBar.setButtonStyleAsync("dark");
    }
  }, []);

  return (
    // [marca-vupth] Fundo BRANCO (#FFFFFF) em todo o app. Era #F7FAF8, o
    // off-white da paleta ANTIGA — com a marca nova ele ficava um cinza-esverdeado
    // competindo com o `surface` (#F3F5F1), que e justamente quem deve carregar
    // o tom claro nos cards. Fundo branco + surface cinza recria a separacao que
    // o off-white apagava.
    <SafeAreaProvider style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <QueryClientProvider client={queryClient}>
        <GluestackUIProvider config={config}>
          {/* ThemeProvider ENVOLVE o Slot: e ele que pinta o fundo das telas
              (ver `navTheme` acima). Sem isso o navegador usava o cinza
              #F2F2F2 do tema padrao, por cima do branco do SafeAreaProvider. */}
          <ThemeProvider value={navTheme}>
            {/* expo-status-bar e mais confiavel que o StatusBar do RN no Expo:
                style="dark" = icones escuros (visiveis sobre fundo claro). */}
            <StatusBar style="dark" backgroundColor="#FFFFFF" />
            {/* O erro entra no portao de proposito: fonte que nao carrega deve
                degradar para a fonte do sistema, nunca prender o app numa tela
                de carregamento. Foi o spinner eterno de 2026-08-27. */}
            {fontLoaded || fontError ? <Slot /> : <Loading />}
          </ThemeProvider>
        </GluestackUIProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
