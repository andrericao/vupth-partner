import { useEffect, useState, useCallback } from "react";
import { router } from "expo-router";
import { Loading } from "@components/Loading";
import { ServerWarmup } from "@components/ServerWarmup";
import { useAuthStore } from "@store/auth.store";
import { getPostLoginRoute } from "@lib/routing";
import { waitForBackend } from "@lib/readiness";

type WarmupPhase = "warming" | "failed" | "ready";

export default function RootIndex() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  // Portao de cold start: so liberamos login/cadastro depois que o backend
  // responde readiness UP (ver src/lib/readiness.ts + CLAUDE.md / PRD_BACKEND 18c).
  const [phase, setPhase] = useState<WarmupPhase>("warming");

  const warmUp = useCallback(async () => {
    setPhase("warming");
    // Sem minimo de splash (abertura-sem-piscar, 18/10): o minimo de 3,4 s era
    // espera inventada, mesmo com o servidor quente. O unico tempo fixo e a
    // varredura de entrada do V (0,6 s), que o ServerWarmup espera por conta propria.
    const ok = await waitForBackend();
    setPhase(ok ? "ready" : "failed");
  }, []);

  useEffect(() => {
    // portao de readiness on-mount; setPhase e o efeito desejado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    warmUp();
  }, [warmUp]);

  // Tokens locais (SecureStore) carregam em paralelo; nao dependem do backend.
  useEffect(() => {
    useAuthStore.getState().loadStoredTokens();
  }, []);

  // O V sai antes de a rota trocar: a navegacao so acontece quando ele terminou
  // de sair. "Pronto" espera tambem o token local (SecureStore) — senao o V
  // sairia e sobraria um <Loading /> por cima da Home.
  const [saiu, setSaiu] = useState(false);
  const pronto = phase === "ready" && !isLoading;

  useEffect(() => {
    if (!saiu) return;

    const roles = user?.roles ?? [];
    if (isAuthenticated && roles.length > 0) {
      const route = getPostLoginRoute(roles);
      router.replace(route as any);
    } else {
      router.replace("/(auth)" as any);
    }
  }, [saiu, isAuthenticated, user]);

  if (phase === "failed") return <ServerWarmup failed onRetry={warmUp} />;
  if (saiu) return <Loading />;
  return <ServerWarmup pronto={pronto} onSaiu={() => setSaiu(true)} />;
}
