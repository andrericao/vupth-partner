import "../global.css"; // NativeWind: habilita as classes Tailwind
import { useEffect } from "react";
import { Alert, LogBox, Platform, View } from "react-native";
import { vars } from "nativewind";
import { StatusBar } from "expo-status-bar";
import { Slot } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@lib/queryClient";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import * as NavigationBar from "expo-navigation-bar";
// ⚠️ As fontes vem de `assets/fonts/`, NAO de `@expo-google-fonts`.
// A Cloudflare Pages EXCLUI `node_modules` do deploy, por design — e o
// `expo export --platform web` grava os assets espelhando o caminho de origem,
// entao os TTFs saiam em `dist/assets/node_modules/@expo-google-fonts/...` e
// eram descartados em silencio. O app publicado ficava num spinner eterno
// (2026-08-27). Travado por teste em `brandTokens.test.ts`.
import { useFonts } from "expo-font";
import { Loading } from "@components/Loading";
import { usePushRegistration } from "@hooks/usePushRegistration";
import { instalarAlertWeb } from "../web-shims/alert";
import { pedirParaNaoTraduzir } from "@lib/naoTraduzir";
import { instalarDialogoNativo } from "@lib/alertNativo";
import { DialogoVupth } from "@components/DialogoVupth";
import { ReativarContaDoApp } from "@components/ReativarContaDoApp";
import { useFonteStore } from "@store/fonte.store";
import { varsDaFonte } from "@lib/fonte";
import Constants from "expo-constants";
import { iniciarSentry } from "@lib/sentry";
import { commitDoCodigo } from "@lib/commitDoCodigo";
import { API_ENV } from "@lib/api";

LogBox.ignoreLogs(["Invalid prop `fill` supplied to `React.Fragment`"]);

// sentry (Andre, 09/10): erros e crash, so com o DSN do ambiente; sem ele, inerte.
iniciarSentry({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  ambiente: API_ENV,
  commit: commitDoCodigo(Constants.expoConfig),
  emTeste: !!process.env.JEST_WORKER_ID,
});

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

// O React Native Web nao implementa `Alert`: a chamada nao falha, nao loga e
// nao pinta NADA. Eram 100 avisos mudos no navegador — inclusive o motivo de
// uma acao recusada, que e quando o usuario mais precisa de resposta (A5,
// achado pelo Front-Client).
//
// O patch troca o metodo no objeto que o react-native exporta, entao pega as
// 100 chamadas existentes E as futuras, sem import novo em tela nenhuma. Roda
// no boot, antes de qualquer interacao poder disparar um Alert — e antes do
// primeiro render, que ja pode avisar de erro.
if (Platform.OS === "web") instalarAlertWeb(Alert);

// 🔴 E pede ao navegador para NAO traduzir (ver src/lib/naoTraduzir.ts): a
// traducao automatica reescreve o DOM por baixo do React e quebra o campo
// controlado — R$ 60,00 chegava ao calculo como R$ 0,06. No boot, antes do
// primeiro render, que e antes de o navegador decidir traduzir.
if (Platform.OS === "web") pedirParaNaoTraduzir();

// No NATIVO o Alert e do sistema operacional: nao aceita fonte, cor nem raio, e
// por isso a caixa do APK ficou pior que a da web depois do A5 ("o modal de
// aviso na versao web ta melhor que o modal do apk", 08/09). Mesma tatica do
// shim: troca o metodo, e as 100 chamadas passam a desenhar a caixa da marca —
// o MESMO desenho, numero por numero.
//
// A rede esta no proprio instalador: sem o <DialogoVupth /> montado, ele cai no
// Alert original. App que troca o dialogo por um modal que ninguem desenha fica
// MUDO, que e o defeito que acabamos de consertar do outro lado.
instalarDialogoNativo();

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

  // "Tamanho da fonte" (Andre, 26/09, igual ao Client): o passo escolhido vira
  // as variaveis de tamanho que as classes de texto leem (src/lib/fonte.ts). Sem
  // remontar a arvore: remontar levaria a pessoa de volta a tela inicial — os
  // tamanhos escritos em style acompanham pelo useFs.
  const passoDaFonte = useFonteStore((s) => s.passo);
  const restaurarFonte = useFonteStore((s) => s.restaurar);
  useEffect(() => {
    restaurarFonte();
  }, [restaurarFonte]);

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
          <View style={[{ flex: 1 }, vars(varsDaFonte(passoDaFonte))]}>
            {fontLoaded || fontError ? <Slot /> : <Loading />}
            {/* Um so na arvore, e ACIMA de tudo: um aviso disparado por uma tela
                nao pode ser coberto por ela. Fica fora do portao das fontes de
                proposito — erro no boot precisa aparecer mesmo antes delas. */}
            <DialogoVupth />
            {/* desativar-conta (c0f5b17): "Reativar / So consultar" no login de
                conta desativada e no 403 ACCOUNT_DEACTIVATED de qualquer tela. */}
            <ReativarContaDoApp />
          </View>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
