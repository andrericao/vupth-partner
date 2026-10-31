import { useQuery } from "@tanstack/react-query";
import { useProfessionalStore } from "@store/professional.store";
import { encaixesEsperandoOCliente, encaixesParaResponder, listarEncaixes, type PedidoDeEncaixe } from "@lib/fitIn";

/**
 * aceitar-encaixe (DEC-136 a 141): os encaixes novos. Mesma queryKey no menu,
 * na Fila e na tela de Solicitacoes: o cache e um so. O push FIT_IN_REQUESTED
 * avisa; o refetch de 30s e o fallback. So conta o que espera a resposta do
 * profissional (a contraproposta dele espera o cliente, nao vira badge).
 */
export function usePendingFitIns(): {
  count: number;
  paraResponder: PedidoDeEncaixe[];
  esperandoOCliente: PedidoDeEncaixe[];
  refetch: () => Promise<unknown>;
  isFetching: boolean;
} {
  const professional = useProfessionalStore((s) => s.professional);
  const profId = professional?.id;
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["fit-in-requests", profId],
    queryFn: listarEncaixes,
    enabled: !!profId && !!professional?.establishment_id,
    refetchInterval: 30000,
  });
  const paraResponder = encaixesParaResponder(data);
  return {
    count: paraResponder.length,
    paraResponder,
    esperandoOCliente: encaixesEsperandoOCliente(data),
    refetch,
    isFetching,
  };
}
