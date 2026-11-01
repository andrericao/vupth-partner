import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@lib/api";
import { lerUltimaFila, salvarUltimaFila } from "@lib/ultimaFila";
import { intervaloDaFilaAoVivo } from "@lib/pollingFila";
import type { EstablishmentWithProfessionals } from "@lib/types";
import { useQueueSocket } from "@hooks/useQueueSocket";
import { useProfessionalStore } from "@store/professional.store";
import { useWsDiagnosticsStore } from "@store/wsDiagnostics.store";
import { resumirAtendimento, linhaDoResumo } from "@lib/snapshotDiag";

// Query da fila SEM o socket STOMP. Compartilha a mesma queryKey — o React
// Query deduplica com quem ja assinou via useQueuePolling. Usada por telas que
// so precisam do snapshot (checklist/dot de prontidao) e NAO devem abrir um
// segundo socket para o mesmo topico.
export function useProfessionalsWithQueueQuery(establishmentId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["professionals-with-queue", establishmentId];

  // Abre pintado com o ultimo dado guardado; o GET real chega por cima.
  useEffect(() => {
    if (!establishmentId) return;
    let vivo = true;
    lerUltimaFila(establishmentId).then((guardado) => {
      if (vivo && guardado && queryClient.getQueryData(queryKey) === undefined) {
        queryClient.setQueryData(queryKey, guardado);
      }
    });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [establishmentId, queryClient]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get<EstablishmentWithProfessionals>(
        `/establishment/id/${establishmentId}/professionals-with-queue`
      );
      // Diagnostico de device: o que o GET trouxe, antes de o WS poder
      // sobrescrever. Ver src/lib/snapshotDiag.ts.
      const meuId = useProfessionalStore.getState().professional?.id ?? null;
      useWsDiagnosticsStore
        .getState()
        .marcarSnapshot("GET", linhaDoResumo("GET", resumirAtendimento(data, meuId)));
      if (establishmentId) void salvarUltimaFila(establishmentId, data);
      return data;
    },
    enabled: !!establishmentId,
    refetchInterval: intervaloDaFilaAoVivo(60000),
    staleTime: 15000,
  });
}

export function useQueuePolling(establishmentId: string | null) {
  // Tempo real via STOMP; o refetchInterval da query fica so como fallback.
  useQueueSocket(establishmentId);
  return useProfessionalsWithQueueQuery(establishmentId);
}
