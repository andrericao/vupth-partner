import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "@react-navigation/native";
import { useEstablishmentStore } from "@store/establishment.store";
import type { EstablishmentDetail } from "@store/establishment.store";
import { useProfessionalsWithQueueQuery } from "@hooks/useQueuePolling";
import { ownerCompletion } from "@lib/completion";
import type { Completion } from "@lib/completion";
import { buscarHorarios } from "@lib/horariosApi";
import { temHorarioDefinido } from "@lib/horarioSemanal";

const STALE_MS = 5000;

// Fonte unica da completude do DONO — usada pela faixa (Home/dashboard), pelo
// checklist (Dados do Estabelecimento) e pelo dot (menu). Evita duplicar o
// mapeamento de flags. A query da fila e deduplicada pelo React Query (mesma
// queryKey), entao chamar em varias telas nao multiplica requisicoes.
export function useOwnerCompletion(): {
  completion: Completion;
  professionalsCount: number;
  /** O detalhe da loja (o mesmo da completude), para a tela nao buscar de novo. */
  detail: EstablishmentDetail | null;
  routeFor: (key: string) => string | undefined;
} {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const fetchEstablishmentById = useEstablishmentStore((s) => s.fetchEstablishmentById);
  const establishmentId = establishment?.id ?? null;
  const isFocused = useIsFocused();

  const { data: queueData } = useProfessionalsWithQueueQuery(establishmentId);
  const professionals = queueData?.professionals ?? [];

  // cache-nas-telas-de-requisitos (Andre, 22/10): o dashboard, o menu e os Dados
  // do Estabelecimento usam este hook ao mesmo tempo. Com `useState` + `useEffect`
  // cada um buscava o seu detalhe e a sua semana e a barra de progresso enchia uma
  // vez por tela (e de novo a cada foco). No React Query a busca e uma so
  // (deduplicada), o ultimo valor aparece na hora e a atualizacao vem em segundo
  // plano — so se o valor guardado tiver mais de 5s.
  const ativo = !!establishmentId && isFocused;
  const detailQuery = useQuery({
    queryKey: ["owner-completion-detail", establishmentId],
    queryFn: () => fetchEstablishmentById(establishmentId as string),
    enabled: ativo,
    staleTime: STALE_MS,
    retry: false,
  });
  const detail = detailQuery.data ?? null;

  // A semana (S27). `undefined` = ainda nao chegou; `null` = backend sem a
  // rota. Nos dois casos o horario unico decide, como antes.
  const semanaQuery = useQuery({
    queryKey: ["owner-completion-semana", establishmentId],
    queryFn: () => buscarHorarios(establishmentId as string),
    enabled: ativo,
    staleTime: STALE_MS,
    retry: false,
  });
  const semana: { configured: boolean } | null | undefined = semanaQuery.data;

  // `detail` (GET /establishment/id/{id}) e a fonte FRESCA e completa — traz
  // name/service_type/hours/address/phone/instagram do banco. A store
  // `establishment` (SecureStore + projecao enxuta do /mine) pode NAO ter
  // opening_time/closing_time, o que fazia horario/tipo aparecerem como
  // pendencia na Home ate abrir "Dados Cadastrais" (que reescrevia a store).
  // Por isso: assim que `detail` chega, ele manda; a store so cobre o 1o paint.
  const completion = ownerCompletion({
    hasName: !!(detail ? detail.name : establishment?.name),
    hasServiceType: !!(detail ? detail.service_type : establishment?.service_type),
    hasAddress: !!(detail ? detail.address?.neighborhood : establishment?.address?.neighborhood),
    // Com a semana, vale o `configured`: o opening_time agora e o horario DE
    // HOJE e vem nulo no dia em que a loja fecha (domingo viraria pendencia).
    hasHours: temHorarioDefinido(semana ?? null, detail ?? establishment ?? null),
    hasProfessionalWithService: professionals.length > 0,
    hasPhone: !!(detail ? detail.phone : establishment?.phone),
    hasInstagram: !!(detail ? detail.instagram : establishment?.instagram),
  });

  const routeFor = (key: string): string | undefined => {
    const map: Record<string, string> = {
      name: "/(owner)/establishment-registration",
      serviceType: "/(owner)/establishment-registration",
      address: "/(owner)/onboarding/address",
      hours: "/(owner)/establishment-hours",
      professionalWithService: `/(owner)/add-professional?establishmentId=${establishmentId ?? ""}`,
      phone: "/(owner)/establishment-registration",
      instagram: "/(owner)/establishment-registration",
    };
    return map[key];
  };

  return { completion, professionalsCount: professionals.length, detail, routeFor };
}
