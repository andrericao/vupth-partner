import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProfessionalStore } from "@store/professional.store";
import { useAttendanceStore } from "@store/attendance.store";
import { activeCutRequests } from "@lib/cutRequests";
import type { CutRequestResponse } from "@lib/types";

/**
 * Pedidos de encaixe (C2) ainda aguardando decisao.
 *
 * Extraido porque a MESMA query estava copiada em `queue.tsx` e
 * `queue-options.tsx`, e agora o rodape tambem precisa dela (a aba Encaixes
 * leva badge de contagem no Pencil). Tres copias da mesma logica de expiracao
 * seria pedir pra elas divergirem.
 *
 * Mesma `queryKey` das telas de proposito: o React Query compartilha o cache,
 * entao o rodape nao gera requisicao extra e o badge acompanha a lista.
 * O WS pessoal (eventos `CUT_*`, assinado no useQueueSocket) invalida a query;
 * o refetch de 30s e o fallback pra socket caido.
 */
export function usePendingCutRequests(): { count: number; pending: CutRequestResponse[] } {
  const professional = useProfessionalStore((s) => s.professional);
  const fetchCutRequests = useAttendanceStore((s) => s.fetchCutRequests);

  const profId = professional?.id;
  const establishmentId = professional?.establishment_id ?? null;

  // Relogio ancorado em estado: `Date.now()` no render e impuro
  // (react-hooks/purity). Atualiza no callback do fetch — granularidade de
  // sobra p/ um TTL de 5min.
  const [nowMs, setNowMs] = useState(() => Date.now());

  const { data } = useQuery({
    queryKey: ["cut-requests", profId],
    queryFn: async () => {
      const list = await fetchCutRequests();
      setNowMs(Date.now()); // callback de sistema externo: permitido
      return list;
    },
    enabled: !!profId && !!establishmentId,
    refetchInterval: 30000,
  });

  const pending = activeCutRequests(data, nowMs);
  return { count: pending.length, pending };
}
