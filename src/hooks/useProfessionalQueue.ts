import { useQuery } from "@tanstack/react-query";
import { api } from "@lib/api";
import type { QueueResponse } from "@lib/types";
import { useQueueSocket } from "@hooks/useQueueSocket";

export function useProfessionalQueue(
  professionalId: string | null,
  establishmentId: string | null
) {
  // O socket assina o topico do establishment e invalida ["professional-queue"]
  // a cada mudanca, refrescando esta query; o refetchInterval fica como fallback.
  useQueueSocket(establishmentId);

  return useQuery({
    queryKey: ["professional-queue", professionalId, establishmentId],
    queryFn: async () => {
      const { data } = await api.get<QueueResponse>(
        `/client-queue/${professionalId}/queue`,
        { params: { establishmentId } }
      );
      return data;
    },
    enabled: !!professionalId && !!establishmentId,
    refetchInterval: 60000,
    staleTime: 15000,
  });
}
