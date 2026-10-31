import { useQuery } from "@tanstack/react-query";
import { useProfessionalStore } from "@store/professional.store";
import { ENCAIXE_NOVO_LIGADO } from "@lib/recursos";
import { encaixesEsperandoOCliente, encaixesParaResponder, listarEncaixes, type PedidoDeEncaixe } from "@lib/fitIn";

/**
 * aceitar-encaixe (DEC-136 a 141): os encaixes novos. Mesma queryKey no menu,
 * na Fila e na tela de Solicitacoes: o cache e um so. O push FIT_IN_REQUESTED
 * avisa; o refetch de 30s e o fallback. So conta o que espera a resposta do
 * profissional (a contraproposta dele espera o cliente, nao vira badge).
 * Desligado (DEC-144, `ENCAIXE_NOVO_LIGADO`): nao consulta e devolve vazio.
 */
export function usePendingFitIns(ligado: boolean = ENCAIXE_NOVO_LIGADO): {
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
    enabled: ligado && !!profId && !!professional?.establishment_id,
    refetchInterval: 30000,
  });
  const paraResponder = ligado ? encaixesParaResponder(data) : [];
  return {
    count: paraResponder.length,
    paraResponder,
    esperandoOCliente: ligado ? encaixesEsperandoOCliente(data) : [],
    refetch,
    isFetching,
  };
}
