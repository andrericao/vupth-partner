import { useQuery } from "@tanstack/react-query";
import { api } from "@lib/api";
import type { EstablishmentWithProfessionals } from "@lib/types";
import { useQueueSocket } from "@hooks/useQueueSocket";

export function useQueuePolling(establishmentId: string | null) {
  // Tempo real via STOMP; o refetchInterval abaixo fica so como fallback.
  useQueueSocket(establishmentId);

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
