import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@lib/api";
import { useAuthStore } from "@store/auth.store";

const CHAVE = ["minha-foto"] as const;

/**
 * A foto de quem esta logado (GET /profile/me -> profile_image_url) e a troca
 * dela no cache — o upload devolve a URL nova, sem precisar reler o perfil.
 */
export function useMinhaFoto(): { uri: string | null; trocar: (uri: string | null) => void } {
  const logado = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: CHAVE,
    queryFn: async () => {
      const { data } = await api.get("/profile/me");
      return (data?.profile_image_url as string | null) ?? null;
    },
    enabled: logado,
    staleTime: 5 * 60 * 1000,
  });
  return {
    uri: data ?? null,
    trocar: (uri) => queryClient.setQueryData(CHAVE, uri),
  };
}
