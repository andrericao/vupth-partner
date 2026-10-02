import { useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";
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
  ehDeDecisao,
  avisoDoPush,
  tocouNoOk,
  CATEGORIA_CIENCIA,
  ACAO_OK,
  CANAL_ALTA,
} from "@lib/push";
import { useAuthStore } from "@store/auth.store";
import { useWsDiagnosticsStore } from "@store/wsDiagnostics.store";

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
    // Com o app aberto, a de CIENCIA vira aviso com "OK" (listener abaixo) — o
    // banner diria a mesma coisa duas vezes. A de DECISAO segue com o banner:
    // a tela dela (modal do pedido de corte, "quer fechar?") ja abre sozinha.
    handleNotification: async (notificacao) => ({
      shouldShowBanner: ehDeDecisao(notificacao.request.content.data?.type),
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
        // HIGH (Andre, 02/10): aparece no topo na hora, sem esperar. O Backend
        // manda o push com prioridade alta; o canal precisa acompanhar.
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.HIGH,
        }).catch(() => {});
        // ⚠️ O Android NAO muda a importancia de um canal que ja existe: quem
        // instalou antes segue com o "default" em DEFAULT. O canal "alta" nasce
        // HIGH em todo aparelho — o Backend passa a mandar channelId "alta".
        Notifications.setNotificationChannelAsync(CANAL_ALTA, {
          name: "Avisos",
          importance: Notifications.AndroidImportance.HIGH,
        }).catch(() => {});
      } catch {
        // binario sem o modulo nativo de push.
      }
    }
  }, []);

  // O botao "OK" na propria notificacao (app fechado): so fecha, nao abre o app.
  // Aparece quando o push vem com categoryId "CIENCIA" (Backend).
  useEffect(() => {
    if (!Notifications) return;
    try {
      Notifications.setNotificationCategoryAsync(CATEGORIA_CIENCIA, [
        { identifier: ACAO_OK, buttonTitle: "OK", options: { opensAppToForeground: false } },
      ]).catch(() => {});
    } catch {
      // binario sem o modulo nativo de push.
    }
  }, []);

  // Push de ciencia com o app aberto -> aviso com "OK" (Andre, 02/10; igual ao
  // Client, 52076672). O de decisao fica com o banner e a tela dele.
  useEffect(() => {
    if (!Notifications) return;
    try {
      const sub = Notifications.addNotificationReceivedListener((notificacao) => {
        const conteudo = notificacao.request.content;
        if (ehDeDecisao(conteudo.data?.type)) return;
        const aviso = avisoDoPush(conteudo);
        if (aviso) Alert.alert(aviso.titulo, aviso.mensagem, [{ text: "OK" }]);
      });
      return () => sub.remove();
    } catch {
      // binario sem o modulo nativo de push — sem aviso.
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
          // O QA precisa VER por que o push nao chegou (A6). Sem isto, o
          // `catch` abaixo engolia a causa e a tela nao dizia nada.
          onEstado: (estado, detalhe) =>
            useWsDiagnosticsStore.getState().marcarPush(estado, detalhe),
        });
        if (!token || cancelled) return;
        useWsDiagnosticsStore.getState().marcarToken(token);

        try {
          await registerDevice(token, mapPlatform(Platform.OS));
        } catch (erro: any) {
          // "Token obtido, backend nao sabe" e um caso a parte no painel.
          useWsDiagnosticsStore
            .getState()
            .marcarEnvio("falhou", erro?.message ?? "erro ao registrar o aparelho");
          throw erro;
        }
        useWsDiagnosticsStore.getState().marcarEnvio("ok");
        useWsDiagnosticsStore.getState().marcarPush("registrado");
        await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
        didRegister.current = true;
      } catch (erro: any) {
        // best-effort — push nunca deve derrubar o fluxo de login. Mas agora
        // deixa rastro: silencio total foi o que manteve o A6 sem diagnostico.
        useWsDiagnosticsStore
          .getState()
          .marcarPush("falhou", erro?.message ?? "erro ao registrar o aparelho");
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
          // "OK" so fecha a notificacao — nao navega.
          if (tocouNoOk(response)) {
            Notifications.dismissNotificationAsync(response.notification.request.identifier).catch(() => {});
            return;
          }
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
