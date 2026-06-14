import { useEffect } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { WS_URL } from "@lib/api";
import type { EstablishmentWithProfessionals } from "@lib/types";

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

      client = new Client({
        webSocketFactory: () => new WebSocket(WS_URL),
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        reconnectDelay: 5000,
        onConnect: () => {
          client?.subscribe(
            `/topic/establishment/${establishmentId}/queue`,
            (message: IMessage) => {
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
              } catch {}
            }
          );
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
