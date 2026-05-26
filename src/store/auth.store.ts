import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api } from "@lib/api";
import { getRolesFromToken } from "@lib/jwt";
import { useEstablishmentStore } from "@store/establishment.store";
import { useProfessionalStore } from "@store/professional.store";

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
    try {
      await api.post("/auth/logout");
    } catch {}

    await SecureStore.deleteItemAsync("vupth_access_token");
    await SecureStore.deleteItemAsync("vupth_refresh_token");

    useEstablishmentStore.getState().reset();
    useProfessionalStore.getState().reset();

    set({ user: null, isAuthenticated: false });
  },

  loadStoredTokens: async () => {
    const token = await SecureStore.getItemAsync("vupth_access_token");
    if (!token) {
      set({ isLoading: false });
      return;
    }

    const roles = getRolesFromToken(token);

    set({
      user: { id: "", email: "", roles },
      isAuthenticated: true,
      isLoading: false,
    });
  },
}));
