import { useQuery } from "@tanstack/react-query";
import { obterPagamentosPendentes, type PagamentoPendente } from "@lib/pagamento";

/**
 * pagamento-pix (adendo 1a0616c): os pagamentos pendentes do profissional.
 * A mesma queryKey no rodape (dot da aba Relatorios) e na tela: o cache e um so.
 * O WS pessoal (PAYMENT_*) invalida; o refetch de 60s e o fallback.
 */
export function usePagamentosPendentes(ativo: boolean): { aguardando: number; itens: PagamentoPendente[] } {
  const { data } = useQuery({
    queryKey: ["pending-payments"],
    queryFn: obterPagamentosPendentes,
    enabled: ativo,
    refetchInterval: 60_000,
  });
  return { aguardando: data?.awaiting_count ?? 0, itens: data?.items ?? [] };
}
