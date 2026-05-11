import { useAuthStore } from "../auth.store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("@lib/api", () => ({
  api: {
    post: jest.fn(),
  },
}));

import * as SecureStore from "expo-secure-store";
import { api } from "@lib/api";

function makeToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake`;
}

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  jest.clearAllMocks();
});

describe("auth.store", () => {
  describe("login", () => {
    it("saves tokens and sets user on successful login", async () => {
      const accessToken = makeToken({
        sub: "uuid-1",
        email: "test@email.com",
        roles: ["CLIENT", "OWNER"],
        exp: 9999999999,
      });

      (api.post as jest.Mock).mockResolvedValue({
        data: {
          user: { id: "uuid-1", email: "test@email.com" },
          tokens: {
            access_token: accessToken,
            refresh_token: "refresh-abc",
          },
        },
      });

      await useAuthStore.getState().login("test@email.com", "Senha@123");

      expect(api.post).toHaveBeenCalledWith("/auth/login", {
        email: "test@email.com",
        password: "Senha@123",
      });
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "vupth_access_token",
        accessToken
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "vupth_refresh_token",
        "refresh-abc"
      );

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.id).toBe("uuid-1");
      expect(state.user?.roles).toEqual(["CLIENT", "OWNER"]);
    });
  });

  describe("logout", () => {
    it("clears tokens and resets state", async () => {
      useAuthStore.setState({
        user: { id: "uuid-1", email: "test@email.com", roles: ["CLIENT"] },
        isAuthenticated: true,
      });

      (api.post as jest.Mock).mockResolvedValue({});

      await useAuthStore.getState().logout();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        "vupth_access_token"
      );
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        "vupth_refresh_token"
      );

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe("loadStoredTokens", () => {
    it("sets authenticated when token exists", async () => {
      const token = makeToken({
        sub: "uuid-1",
        email: "t@t.com",
        roles: ["CLIENT"],
        exp: 9999999999,
      });
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(token);

      await useAuthStore.getState().loadStoredTokens();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it("stays unauthenticated when no token", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await useAuthStore.getState().loadStoredTokens();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });
});
