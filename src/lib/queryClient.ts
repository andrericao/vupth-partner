import { QueryClient } from "@tanstack/react-query";
import { ligarFocoAoAppState } from "@lib/pollingFila";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Segundo plano nao consulta (refetchInterval so roda com o app em foco).
ligarFocoAoAppState();
