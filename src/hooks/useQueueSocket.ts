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
import { useWsDiagnosticsStore } from "@store/wsDiagnostics.store";
import { useProfessionalStore } from "@store/professional.store";
import { resumirAtendimento, linhaDoResumo } from "@lib/snapshotDiag";
import { broadcastApagaAtendimento } from "@lib/broadcastSuspeito";

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
        // HEARTBEAT EXPLICITO (2026-08-05). Estes 10s espelham o
        // `HEARTBEAT_MS` do `WebSocketConfig` do backend, que passou a mandar
        // `heart-beat:10000,10000` no CONNECTED (S17, verificado no Render).
        // Ja era o default do @stomp/stompjs — o problema e que era default:
        // se alguem mexer na config, o heartbeat mudava calado e o socket
        // zumbi voltava sem ninguem ligar uma coisa a outra. Declarado vira
        // contrato; se o servidor mudar o valor, estas duas linhas mudam junto.
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
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
        onConnect: (frame) => {
          // DIAGNOSTICO (2026-08-05): os headers do CONNECTED sao o que decide
          // o teste — `heart-beat` (S17) e `user-name` (S14, ausente = sessao
          // ANONIMA). Uma conexao so serve os dois canais aqui, entao os dois
          // sao marcados juntos.
          const headers = (frame?.headers ?? {}) as Record<string, string>;
          useWsDiagnosticsStore.getState().markConnected("public", headers);
          useWsDiagnosticsStore.getState().markConnected("personal", headers);

          client?.subscribe(topic, (message: IMessage) => {
            useWsDiagnosticsStore.getState().markMessage("public");
            try {
              const snapshot = JSON.parse(
                message.body
              ) as EstablishmentWithProfessionals;
              // `setQueryData` SUBSTITUI o cache, nao mescla. Se o broadcast
              // vier sem `current_attendance`, ele apaga o que o GET trouxe — o
              // card nao monta e o Finalizar fica inalcancavel. E a hipotese
              // aberta do "nao consigo finalizar" desde 31/08.
              //
              // Aqui NAO se adivinha: quando o broadcast apaga um atendimento em
              // curso sem dizer nada sobre ele, a remocao nao e aplicada e o GET
              // — que e a autoridade — e consultado. Mesclar seria pior: o
              // broadcast que ENCERRA tambem vem sem o campo, e mesclar deixaria
              // um card fantasma. Ver `broadcastApagaAtendimento`.
              const anterior = queryClient.getQueryData<EstablishmentWithProfessionals>(
                ["professionals-with-queue", establishmentId]
              );
              const apaga = broadcastApagaAtendimento(anterior, snapshot);
              if (apaga) {
                // Registrado no painel dos 7 toques: cada vez que a guarda age e
                // uma prova de que o broadcast e mais pobre que o GET. Sem isto a
                // protecao esconderia justamente o defeito que ela contorna.
                useWsDiagnosticsStore
                  .getState()
                  .marcarSnapshot("WS", "WS apagaria o atendimento em curso — GET consultado");
                queryClient.invalidateQueries({
                  queryKey: ["professionals-with-queue", establishmentId],
                });
              } else {
                queryClient.setQueryData(
                  ["professionals-with-queue", establishmentId],
                  snapshot
                );
              }
              const meuId =
                useProfessionalStore.getState().professional?.id ?? null;
              useWsDiagnosticsStore
                .getState()
                .marcarSnapshot(
                  "WS",
                  linhaDoResumo("WS", resumirAtendimento(snapshot, meuId))
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
            useWsDiagnosticsStore.getState().markMessage("personal");
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
              if (__DEV__) console.log("[ws] erro ao processar notificação pessoal", e);
            }
          });
        },
        onStompError: (frame) => {
          const msg = frame.headers?.message ?? "STOMP error";
          useWsDiagnosticsStore.getState().markError("public", msg);
          useWsDiagnosticsStore.getState().markError("personal", msg);
          if (__DEV__) console.log("[ws] STOMP error:", msg);
        },
        onWebSocketError: () => {
          // Log conciso (sem despejar o evento inteiro). Causa comum: handshake
          // barrado (401) quando o backend de staging nao tem /ws liberado/deployado.
          const msg = `falha no handshake (${WS_URL})`;
          useWsDiagnosticsStore.getState().markError("public", msg);
          useWsDiagnosticsStore.getState().markError("personal", msg);
          if (__DEV__) console.log(`[ws] ${msg} — verifique o deploy do backend`);
        },
        onWebSocketClose: () => {
          useWsDiagnosticsStore.getState().markClosed("public");
          useWsDiagnosticsStore.getState().markClosed("personal");
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
