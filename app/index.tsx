import { useEffect } from "react";
import { router } from "expo-router";
import { Loading } from "@components/Loading";
import { useAuthStore } from "@store/auth.store";
import { getPostLoginRoute } from "@lib/routing";

export default function RootIndex() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    useAuthStore.getState().loadStoredTokens();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const roles = user?.roles ?? [];
    if (isAuthenticated && roles.length > 0) {
      const route = getPostLoginRoute(roles);
      router.replace(route as any);
    } else {
      router.replace("/(auth)" as any);
    }
  }, [isLoading, isAuthenticated, user]);

  return <Loading />;
}
