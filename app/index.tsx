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
    // Mesmo com o backend ja quente, garantimos pelo menos UM ciclo completo da
    // animacao de abertura (4 icones x ~0.8s) — e a "marca" do app (estilo
    // splash da Netflix/Mercado Livre). Ver ServerWarmup/WarmupAnimation.
    const MIN_SPLASH_MS = 3400;
    const started = Date.now();
    const ok = await waitForBackend();
    const elapsed = Date.now() - started;
    if (elapsed < MIN_SPLASH_MS) {
      await new Promise((r) => setTimeout(r, MIN_SPLASH_MS - elapsed));
    }
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

  useEffect(() => {
    if (phase !== "ready" || isLoading) return;

    const roles = user?.roles ?? [];
    if (isAuthenticated && roles.length > 0) {
      const route = getPostLoginRoute(roles);
      router.replace(route as any);
    } else {
      router.replace("/(auth)" as any);
    }
  }, [phase, isLoading, isAuthenticated, user]);

  if (phase === "warming") return <ServerWarmup />;
  if (phase === "failed") return <ServerWarmup failed onRetry={warmUp} />;
  return <Loading />;
}
