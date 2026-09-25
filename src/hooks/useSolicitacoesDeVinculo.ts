import { useQuery } from "@tanstack/react-query";
import { api } from "@lib/api";
import { solicitacoesPendentes } from "@lib/vinculos";

export const chaveDosVinculos = (establishmentId: string | null | undefined) =>
  ["establishment-affiliations", establishmentId ?? null] as const;

/**
 * Quantas solicitacoes de vinculo esperam o dono (Andre, 25/09: "nenhum dot
 * aponta para ela"). Alimenta o badge do Menu > Profissionais e o do card
 * "Ver solicitacoes".
 *
 * A tela de Solicitacoes invalida esta chave ao aceitar/rejeitar, para o
 * badge nao ficar mentindo. O refetch de 60s cobre o pedido que chega com o
 * dono parado no Menu — nao ha evento de WS para vinculo.
 */
export function useSolicitacoesDeVinculo(establishmentId: string | null | undefined): number {
  const { data } = useQuery({
    queryKey: chaveDosVinculos(establishmentId),
    queryFn: async () => {
      const { data } = await api.get(`/establishment/${establishmentId}/affiliations`);
      return data;
    },
    enabled: !!establishmentId,
    refetchInterval: 60000,
  });
  return solicitacoesPendentes(data);
}
