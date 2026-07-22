import { useEffect } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { WS_URL } from "@lib/api";
import type { EstablishmentWithProfessionals, QueueNotification } from "@lib/types";
import { isCutRequestEvent } from "@lib/cutRequests";

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
      const token = await SecureStore.getItemAsync("vupth_access_token");
      if (!active) return;

      const topic = `/topic/establishment/${establishmentId}/queue`;

      client = new Client({
        webSocketFactory: () => new WebSocket(WS_URL),
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        reconnectDelay: 5000,
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

    return () => {
      active = false;
      client?.deactivate();
    };
  }, [establishmentId, queryClient]);
}
