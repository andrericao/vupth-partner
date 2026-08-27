import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api } from "@lib/api";
import { getRolesFromToken, decodeToken } from "@lib/jwt";
import { useEstablishmentStore } from "@store/establishment.store";
import { useProfessionalStore } from "@store/professional.store";
import { useAttendanceStore } from "@store/attendance.store";
import { unregisterDevice } from "@lib/push";

type User = {
  id: string;
  email: string;
  roles: string[];
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  logout: () => Promise<void>;
  loadStoredTokens: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });

    await SecureStore.setItemAsync(
      "vupth_access_token",
      data.tokens.access_token
    );
    await SecureStore.setItemAsync(
      "vupth_refresh_token",
      data.tokens.refresh_token
    );

    const roles = getRolesFromToken(data.tokens.access_token);

    set({
      user: { id: data.user.id, email: data.user.email, roles },
      isAuthenticated: true,
    });
  },

  register: async (email, password) => {
    await api.post("/auth/register", { email, password });
  },

  // Os endpoints de /profile retornam novos tokens (o email muda o subject do JWT).
  // Persistimos os tokens novos e atualizamos o usuario para nao deslogar.
  updateEmail: async (email) => {
    const { data } = await api.patch("/profile/update-email/me", { email });

    await SecureStore.setItemAsync("vupth_access_token", data.tokens.access_token);
    await SecureStore.setItemAsync("vupth_refresh_token", data.tokens.refresh_token);

    const roles = getRolesFromToken(data.tokens.access_token);
    set((state) => ({
      user: state.user
        ? { ...state.user, email: data.user?.email ?? email, roles }
        : null,
    }));
  },

  // Breaking backend 2026-07-23: exige a senha ATUAL (conferida com
  // PasswordEncoder.matches). Errada => 401 CURRENT_PASSWORD_INVALID (erro de
  // campo, tratado no interceptor sem refresh/logout); ausente => 422.
  updatePassword: async (currentPassword, newPassword) => {
    const { data } = await api.patch("/profile/update-password/me", {
      current_password: currentPassword,
      password: newPassword,
    });

    await SecureStore.setItemAsync("vupth_access_token", data.tokens.access_token);
    await SecureStore.setItemAsync("vupth_refresh_token", data.tokens.refresh_token);

    const roles = getRolesFromToken(data.tokens.access_token);
    set((state) => ({
      user: state.user ? { ...state.user, roles } : null,
    }));
  },

  // Esqueci minha senha (S7, backend fatia 1 2026-07-20): codigo de 6 digitos
  // por e-mail (validade 15min, uso unico, max 5 tentativas). Endpoints
  // PUBLICOS — nada de token/estado. O backend responde 200 SEMPRE no
  // forgot-password (anti-enumeracao de e-mails), entao a tela nao tem como
  // saber se o e-mail existe — o texto de sucesso deve refletir isso.
  forgotPassword: async (email) => {
    await api.post("/auth/forgot-password", { email });
  },

  resetPassword: async (email, code, newPassword) => {
    await api.post("/auth/reset-password", { email, code, new_password: newPassword });
  },

  refreshToken: async () => {
    const refreshToken = await SecureStore.getItemAsync("vupth_refresh_token");
    if (!refreshToken) return;

    const { data } = await api.post("/auth/refresh", {
      refresh_token: refreshToken,
    });

    await SecureStore.setItemAsync(
      "vupth_access_token",
      data.access_token
    );
    await SecureStore.setItemAsync(
      "vupth_refresh_token",
      data.refresh_token
    );

    const roles = getRolesFromToken(data.access_token);

    set((state) => ({
      user: state.user ? { ...state.user, roles } : null,
    }));
  },

  logout: async () => {
    // Desregistra o device do push antes de derrubar a sessao (best-effort).
    try {
      const pushToken = await SecureStore.getItemAsync("vupth_push_token");
      if (pushToken) {
        await unregisterDevice(pushToken);
        await SecureStore.deleteItemAsync("vupth_push_token");
      }
    } catch {}

    try {
      await api.post("/auth/logout");
    } catch {}

    await SecureStore.deleteItemAsync("vupth_access_token");
    await SecureStore.deleteItemAsync("vupth_refresh_token");

    useEstablishmentStore.getState().reset();
    useProfessionalStore.getState().reset();
    useAttendanceStore.getState().reset();

    set({ user: null, isAuthenticated: false });
  },

  loadStoredTokens: async () => {
    const token = await SecureStore.getItemAsync("vupth_access_token");
    if (!token) {
      set({ isLoading: false });
      return;
    }

    // O JWT ja carrega sub (id), email e roles — restaura os 3 no cold start.
    // Antes so pegava os roles e deixava id/email vazios, entao apos reabrir o
    // app as Configuracoes mostravam e-mail em branco.
    const payload = decodeToken(token);

    await Promise.all([
      useEstablishmentStore.getState().restoreEstablishment(),
      useProfessionalStore.getState().restoreProfessional(),
    ]);

    set({
      user: {
        id: payload?.sub ?? "",
        email: payload?.email ?? "",
        // Pelo normalizador, nao pelo payload cru: o backend manda os papeis
        // como STRING ("ROLE_OWNER,ROLE_CLIENT"), e ler direto daqui devolvia
        // essa string tipada como array. Era o mesmo defeito do
        // `getRolesFromToken`, num segundo lugar — o tsc so achou depois que o
        // tipo do payload passou a dizer a verdade.
        roles: getRolesFromToken(token),
      },
      isAuthenticated: true,
      isLoading: false,
    });
  },
}));
