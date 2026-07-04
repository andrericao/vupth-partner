import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import {
  acquireExpoPushToken,
  registerDevice,
  mapPlatform,
  notificationRoute,
} from "@lib/push";
import { useAuthStore } from "@store/auth.store";

// Chave onde guardamos o Expo Push Token registrado, para o logout conseguir
// desregistrar (DELETE /devices/{token}) — ver auth.store.logout.
export const PUSH_TOKEN_KEY = "vupth_push_token";

// Push em foreground: mostrar banner/lista/som (o WS ja cuida da UI in-app, mas
// o banner reforca o aviso). Registrado uma vez no modulo.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Registra o device para push quando o usuario esta autenticado e trata o toque
// na notificacao. Best-effort: nenhuma falha de push quebra o app.
export function usePushRegistration() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const didRegister = useRef(false);

  // Android exige um canal para exibir notificacoes.
  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      }).catch(() => {});
    }
  }, []);

  // Aquisicao de token + POST /devices (uma vez por sessao autenticada).
  useEffect(() => {
    if (!isAuthenticated || didRegister.current) return;
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
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        const route = notificationRoute(data);
        if (route) router.push(route as any);
      }
    );
    return () => sub.remove();
  }, []);
}
