import { useQuery } from "@tanstack/react-query";
import { api } from "@lib/api";
import type { EstablishmentWithProfessionals } from "@lib/types";
import { useQueueSocket } from "@hooks/useQueueSocket";

// Query da fila SEM o socket STOMP. Compartilha a mesma queryKey — o React
// Query deduplica com quem ja assinou via useQueuePolling. Usada por telas que
// so precisam do snapshot (checklist/dot de prontidao) e NAO devem abrir um
// segundo socket para o mesmo topico.
export function useProfessionalsWithQueueQuery(establishmentId: string | null) {
  return useQuery({
    queryKey: ["professionals-with-queue", establishmentId],
    queryFn: async () => {
      const { data } = await api.get<EstablishmentWithProfessionals>(
        `/establishment/id/${establishmentId}/professionals-with-queue`
      );
      return data;
    },
    enabled: !!establishmentId,
    refetchInterval: 60000,
    staleTime: 15000,
  });
}

export function useQueuePolling(establishmentId: string | null) {
  // Tempo real via STOMP; o refetchInterval da query fica so como fallback.
  useQueueSocket(establishmentId);
  return useProfessionalsWithQueueQuery(establishmentId);
}
