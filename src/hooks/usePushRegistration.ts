import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import {
  acquireExpoPushToken,
  registerDevice,
  mapPlatform,
  notificationRoute,
  pushSupported,
} from "@lib/push";
import { useAuthStore } from "@store/auth.store";

// CARGA PREGUICOSA (2026-08-12). O `expo-notifications` nao e mais importado no
// topo: em ambiente SEM push ele **grita no proprio import** — no Expo Go, desde
// o SDK 53 ("Android Push notifications ... was removed"), e na web ele nem
// existe. Como este hook e importado pelo `_layout`, o erro aparecia ANTES de
// qualquer tela e sujava o QA visual. Agora o modulo so e carregado onde push
// existe de verdade (ver `pushSupported`), e o resto do arquivo trata `null`.
const Notifications: typeof import("expo-notifications") | null = pushSupported({
  os: Platform.OS,
  executionEnvironment: Constants.executionEnvironment,
})
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("expo-notifications")
  : null;

// Chave onde guardamos o Expo Push Token registrado, para o logout conseguir
// desregistrar (DELETE /devices/{token}) — ver auth.store.logout.
export const PUSH_TOKEN_KEY = "vupth_push_token";

// Push em foreground: mostrar banner/lista/som (o WS ja cuida da UI in-app, mas
// o banner reforca o aviso). Registrado uma vez no modulo.
//
// IMPORTANTE (resiliencia OTA): este arquivo pode carregar num binario SEM o
// modulo nativo de notificacoes — ex.: um OTA novo (que ja tem o codigo de push)
// rodando sobre um APK antigo, buildado antes de `expo-notifications`. Sem guarda,
// a chamada nativa lanca no eval do modulo e o app inteiro cai (rollback pro
// bundle embutido velho). O try/catch deixa o resto do app (JS) rodar normal;
// push simplesmente nao funciona ate existir um build com o modulo nativo.
try {
  Notifications?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // binario sem o modulo nativo de push — segue sem handler.
}

// Registra o device para push quando o usuario esta autenticado e trata o toque
// na notificacao. Best-effort: nenhuma falha de push quebra o app.
export function usePushRegistration() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const didRegister = useRef(false);

  // Android exige um canal para exibir notificacoes.
  useEffect(() => {
    if (Notifications && Platform.OS === "android") {
      // try/catch pega o throw SINCRONO (modulo nativo ausente); o .catch pega a
      // rejeicao da promise. Sem os dois, um binario velho quebraria aqui.
      try {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.DEFAULT,
        }).catch(() => {});
      } catch {
        // binario sem o modulo nativo de push.
      }
    }
  }, []);

  // Aquisicao de token + POST /devices (uma vez por sessao autenticada).
  useEffect(() => {
    if (!Notifications || !isAuthenticated || didRegister.current) return;
    let cancelled = false;

    (async () => {
      try {
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          (Constants as any).easConfig?.projectId;

        const token = await acquireExpoPushToken({
          isDevice: Device.isDevice,
          getPermissionsAsync: Notifications.getPermissionsAsync,
          requestPermissionsAsync: Notifications.requestPermissionsAsync,
          getExpoPushTokenAsync: Notifications.getExpoPushTokenAsync,
          projectId,
        });
        if (!token || cancelled) return;

        await registerDevice(token, mapPlatform(Platform.OS));
        await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
        didRegister.current = true;
      } catch {
        // best-effort — push nunca deve derrubar o fluxo de login.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Ao deslogar, permitir novo registro na proxima sessao.
  useEffect(() => {
    if (!isAuthenticated) didRegister.current = false;
  }, [isAuthenticated]);

  // Toque na notificacao -> navega conforme o data.type.
  useEffect(() => {
    // addNotification... toca o modulo nativo: guardado p/ nao quebrar num binario
    // sem `expo-notifications` (OTA novo sobre APK velho).
    if (!Notifications) return;
    try {
      const sub = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data;
          const route = notificationRoute(data);
          if (route) router.push(route as any);
        }
      );
      return () => sub.remove();
    } catch {
      // binario sem o modulo nativo de push — sem listener de toque.
    }
  }, []);
}
