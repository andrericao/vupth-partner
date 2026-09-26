import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "@react-navigation/native";
import { getApiErrorMessage } from "@lib/api";
import { periodRange } from "@lib/time";

export type Periodo = "day" | "week" | "month";

/**
 * O relatorio de um periodo, com o ultimo resultado GUARDADO no cache do React
 * Query. Voltar a tela pinta o numero que ja se tinha e atualiza por tras; o
 * esqueleto so aparece quando nao ha nada guardado (fila do partner, 25/09:
 * "Relatorios pintam o Hoje guardado na hora").
 *
 * A chave leva o `dateFrom`: o "Hoje" de ontem nao e o de hoje, e nao pode ser
 * pintado como se fosse. Rele ao ganhar foco, porque as abas nao remontam.
 */
export function useRelatorioDoPeriodo<T>(
  nome: string,
  dono: string | null | undefined,
  periodo: Periodo,
  buscar: (dateFrom: string, dateTo: string) => Promise<T>
): {
  dados: T | undefined;
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<unknown>;
} {
  const { dateFrom, dateTo } = periodRange(periodo);
  const focado = useIsFocused();

  const q = useQuery({
    queryKey: ["relatorio", nome, dono ?? null, periodo, dateFrom],
    queryFn: () => buscar(dateFrom, dateTo),
    enabled: !!dono,
  });

  const { refetch } = q;
  useEffect(() => {
    if (focado && dono) refetch();
  }, [focado, dono, refetch]);

  return {
    dados: q.data,
    carregando: !!dono && q.data === undefined && q.isPending,
    erro:
      q.error && q.data === undefined
        ? getApiErrorMessage(q.error, "Não foi possível carregar o relatório.")
        : null,
    recarregar: refetch,
  };
}
