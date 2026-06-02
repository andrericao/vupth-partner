import { useQuery } from "@tanstack/react-query";
import { api } from "@lib/api";
import type { EstablishmentWithProfessionals } from "@lib/types";

export function useQueuePolling(establishmentId: string | null) {
  return useQuery({
    queryKey: ["professionals-with-queue", establishmentId],
    queryFn: async () => {
      const { data } = await api.get<EstablishmentWithProfessionals>(
        `/establishment/id/${establishmentId}/professionals-with-queue`
      );
      return data;
    },
    enabled: !!establishmentId,
    refetchInterval: 30000,
    staleTime: 15000,
  });
}
