import { useEffect } from "react";
import { useProfessionalStore } from "@store/professional.store";
import { useProfessionalsWithQueueQuery } from "@hooks/useQueuePolling";
import { professionalCompletion } from "@lib/completion";
import type { Completion } from "@lib/completion";

// Fonte unica da completude do PROFISSIONAL — usada pela faixa (Home/queue),
// pelo checklist (Configuracoes/settings) e pelo dot (profile). A query da fila
// e deduplicada pelo React Query (mesma queryKey). Encaminhamentos: buscar
// estabelecimento e adicionar servico. (Decisao Andre 2026-07-11.)
export function useProfessionalCompletion(): {
  completion: Completion;
  routeFor: (key: string) => string | undefined;
} {
  const professional = useProfessionalStore((s) => s.professional);
  const myServices = useProfessionalStore((s) => s.myServices);
  const fetchMyServices = useProfessionalStore((s) => s.fetchMyServices);
  const establishmentId = professional?.establishment_id ?? null;

  const { data } = useProfessionalsWithQueueQuery(establishmentId);

  useEffect(() => {
    if (establishmentId) fetchMyServices().catch(() => {});
  }, [establishmentId, fetchMyServices]);

  const completion = professionalCompletion({
    isAffiliated: !!establishmentId,
    hasService: myServices.length > 0,
    establishmentReady: (data?.open_status ?? "") === "OPEN",
    hasNickname: !!professional?.nickname,
    hasSpecialty: !!professional?.specialty,
  });

  const routeFor = (key: string): string | undefined => {
    const map: Record<string, string> = {
      affiliated: "/(professional)/find-establishment",
      service: "/(professional)/my-services",
      nickname: "/(professional)/settings",
      specialty: "/(professional)/settings",
    };
    return map[key];
  };

  return { completion, routeFor };
}
