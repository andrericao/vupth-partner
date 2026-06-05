import { useQuery } from "@tanstack/react-query";
import { api } from "@lib/api";
import type { QueueResponse } from "@lib/types";

export function useProfessionalQueue(
  professionalId: string | null,
  establishmentId: string | null
) {
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
    refetchInterval: 30000,
    staleTime: 15000,
  });
}
