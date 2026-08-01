import { useEffect } from "react";
import { AppState } from "react-native";
import { Client, type IMessage } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { WS_URL } from "@lib/api";
import type { EstablishmentWithProfessionals, QueueNotification } from "@lib/types";
import { isCutRequestEvent } from "@lib/cutRequests";
import { isClosingPromptEvent } from "@lib/closing";
import { needsRefresh } from "@lib/socketAuth";
import { useUiStore } from "@store/ui.store";
import { useAuthStore } from "@store/auth.store";

/**
 * Assina o tempo real da fila de um establishment via STOMP.
 *
 * Topico publico `/topic/establishment/{id}/queue` envia o snapshot COMPLETO da
 * fila (identico ao GET .../professionals-with-queue) a cada mudanca. Atualizamos
 * o cache do react-query diretamente — o polling dos hooks de fila fica so como
 * fallback caso o socket caia. Tambem invalidamos a fila por profissional (owner),
 * que usa outro endpoint, para refrescar junto.
 */
export function useQueueSocket(establishmentId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!establishmentId) return;

    let active = true;
    let client: Client | null = null;

    (async () => {
      const topic = `/topic/establishment/${establishmentId}/queue`;

      client = new Client({
        webSocketFactory: () => new WebSocket(WS_URL),
        reconnectDelay: 5000,
        // TOKEN FRESCO A CADA TENTATIVA (estudo de infra 2026-08-01, S14).
        // `beforeConnect` roda em TODA conexao — inclusive nas reconexoes
        // automaticas — entao o header deixa de ser o do mount. Sem isto, o
        // token de 1h expirava e o backend passava a aceitar a sessao como
        // ANONIMA (ele nao recusa token invalido): o app seguia "conectado"
        // sem receber mais nada em /user/queue/notifications.
        beforeConnect: async () => {
          let token = await SecureStore.getItemAsync("vupth_access_token");
          if (needsRefresh(token)) {
            // Best-effort: se o refresh falhar (offline, refresh vencido), a
            // conexao segue com o que houver — o interceptor do axios trata a
            // sessao morta no proximo request HTTP.
            try {
              await useAuthStore.getState().refreshToken();
              token = await SecureStore.getItemAsync("vupth_access_token");
            } catch {
              // segue com o token atual
            }
          }
          if (client) {
            client.connectHeaders = token
              ? { Authorization: `Bearer ${token}` }
              : {};
          }
        },
        // Workaround obrigatorio do @stomp/stompjs no React Native: o WebSocket
        // nativo do RN "engole" o byte NULL que termina cada frame STOMP. Sem
        // isto o frame CONNECTED chega mas o parser nunca o reconhece, entao
        // onConnect nao dispara e a conexao trava em "conectando" (sem erro).
        forceBinaryWSFrames: true,
        appendMissingNULLonIncoming: true,
        onConnect: () => {
          client?.subscribe(topic, (message: IMessage) => {
            try {
              const snapshot = JSON.parse(
                message.body
              ) as EstablishmentWithProfessionals;
              queryClient.setQueryData(
                ["professionals-with-queue", establishmentId],
                snapshot
              );
              queryClient.invalidateQueries({
                queryKey: ["professional-queue"],
              });
            } catch (e) {
              if (__DEV__) console.log("[ws] erro ao processar snapshot", e);
            }
          });

          // WS PESSOAL (C2, 2026-07-22) — mesma conexao, segunda assinatura.
          // O backend dirige o CUT_REQUESTED (com cutRequestId proprio) ao
          // userId da sessao. Nao montamos estado do payload: um evento CUT_*
          // so INVALIDA a query de pendentes, e o GET (fonte da verdade)
          // refaz a lista na hora — o refetch de 30s vira fallback p/ queda
          // silenciosa do socket. Owner sem role PROFESSIONAL simplesmente
          // nunca recebe nada aqui (inofensivo).
          client?.subscribe("/user/queue/notifications", (message: IMessage) => {
            try {
              const notification = JSON.parse(message.body) as QueueNotification;
              if (isCutRequestEvent(notification.type)) {
                queryClient.invalidateQueries({ queryKey: ["cut-requests"] });
              } else if (isClosingPromptEvent(notification.type)) {
                // Auto-fechamento (BUG1): abre o prompt "quer fechar?" com o
                // countdown do graceUntil. O backend fecha sozinho no fim.
                useUiStore.getState().showClosingPrompt(notification.graceUntil ?? null);
              }
            } catch (e) {
              if (__DEV__) console.log("[ws] erro ao processar notificacao pessoal", e);
            }
          });
        },
        onStompError: (frame) => {
          if (__DEV__) console.log("[ws] STOMP error:", frame.headers?.message);
        },
        onWebSocketError: () => {
          // Log conciso (sem despejar o evento inteiro). Causa comum: handshake
          // barrado (401) quando o backend de staging nao tem /ws liberado/deployado.
          if (__DEV__) console.log(`[ws] falha no handshake (${WS_URL}) — verifique o deploy do backend`);
        },
      });

      client.activate();
    })();

    // VOLTA DO BACKGROUND (estudo de infra 2026-08-01, item 4). O Android
    // suspende o processo e o socket morre SEM evento — o stompjs pode demorar
    // a perceber, e enquanto isso nada chega. Na fila o polling mascara; no
    // canal pessoal nao ha nada mascarando. Ao voltar para `active`: refetch da
    // fila (fonte da verdade) e reconexao se o socket nao estiver de pe.
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active" || !active) return;
      queryClient.invalidateQueries({ queryKey: ["professionals-with-queue"] });
      queryClient.invalidateQueries({ queryKey: ["professional-queue"] });
      if (client && !client.connected) {
        // `activate()` e idempotente; o beforeConnect renova o token antes.
        client.activate();
      }
    });

    return () => {
      active = false;
      sub.remove();
      client?.deactivate();
    };
  }, [establishmentId, queryClient]);
}
