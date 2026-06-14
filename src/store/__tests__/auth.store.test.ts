import MockAdapter from "axios-mock-adapter";
import * as SecureStore from "expo-secure-store";
import { api } from "@lib/api";
import { useAuthStore } from "../auth.store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockEstablishmentReset = jest.fn();
const mockRestoreEstablishment = jest.fn().mockResolvedValue(undefined);
jest.mock("@store/establishment.store", () => ({
  useEstablishmentStore: {
    getState: () => ({
      reset: mockEstablishmentReset,
      restoreEstablishment: mockRestoreEstablishment,
    }),
  },
}));

const mockProfessionalReset = jest.fn();
const mockRestoreProfessional = jest.fn().mockResolvedValue(undefined);
jest.mock("@store/professional.store", () => ({
  useProfessionalStore: {
    getState: () => ({
      reset: mockProfessionalReset,
      restoreProfessional: mockRestoreProfessional,
    }),
  },
}));

const mockAttendanceReset = jest.fn();
jest.mock("@store/attendance.store", () => ({
  useAttendanceStore: {
    getState: () => ({ reset: mockAttendanceReset }),
  },
}));

const mock = new MockAdapter(api);

function makeToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake`;
}

const CLIENT_TOKEN = makeToken({
  sub: "uuid-1",
  email: "owner@test.com",
  roles: ["CLIENT"],
  exp: 9999999999,
});

const OWNER_TOKEN = makeToken({
  sub: "uuid-1",
  email: "owner@test.com",
  roles: ["CLIENT", "OWNER"],
  exp: 9999999999,
});

const PROFESSIONAL_TOKEN = makeToken({
  sub: "uuid-2",
  email: "prof@test.com",
  roles: ["CLIENT", "PROFESSIONAL"],
  exp: 9999999999,
});

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  mock.reset();
  jest.clearAllMocks();
});

describe("auth.store", () => {
  describe("register", () => {
    it("calls POST /auth/register with email and password", async () => {
      mock.onPost("/auth/register").reply(201);

      await useAuthStore.getState().register("new@test.com", "Senha@123");

      expect(mock.history.post[0].url).toBe("/auth/register");
      expect(JSON.parse(mock.history.post[0].data)).toEqual({
        email: "new@test.com",
        password: "Senha@123",
      });
    });

    it("throws on 422 validation error", async () => {
      mock.onPost("/auth/register").reply(422, {
        status: 422,
        code: "VALIDATION_ERROR",
        message: "Field validation error",
        fieldErrors: { email: "must be a valid email" },
      });

      await expect(
        useAuthStore.getState().register("invalid", "Senha@123")
      ).rejects.toThrow();
    });

    it("does not change auth state after register (register only creates account)", async () => {
      mock.onPost("/auth/register").reply(201);

      await useAuthStore.getState().register("new@test.com", "Senha@123");

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe("login", () => {
    it("saves tokens and sets user with roles on success", async () => {
      mock.onPost("/auth/login").reply(200, {
        user: { id: "uuid-1", email: "owner@test.com" },
        tokens: {
          access_token: CLIENT_TOKEN,
          refresh_token: "refresh-abc",
          expires_in: 604799,
        },
      });

      await useAuthStore.getState().login("owner@test.com", "Senha@123");

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "vupth_access_token",
        CLIENT_TOKEN
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "vupth_refresh_token",
        "refresh-abc"
      );

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual({
        id: "uuid-1",
        email: "owner@test.com",
        roles: ["CLIENT"],
      });
    });

    it("throws on 401 invalid credentials", async () => {
      mock.onPost("/auth/login").reply(401, {
        status: 401,
        message: "Invalid credentials",
      });

      await expect(
        useAuthStore.getState().login("wrong@test.com", "wrong")
      ).rejects.toThrow();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it("extracts OWNER roles from token after login", async () => {
      mock.onPost("/auth/login").reply(200, {
        user: { id: "uuid-1", email: "owner@test.com" },
        tokens: {
          access_token: OWNER_TOKEN,
          refresh_token: "refresh-xyz",
          expires_in: 604799,
        },
      });

      await useAuthStore.getState().login("owner@test.com", "Senha@123");

      expect(useAuthStore.getState().user?.roles).toEqual([
        "CLIENT",
        "OWNER",
      ]);
    });

    it("extracts PROFESSIONAL roles from token after login", async () => {
      mock.onPost("/auth/login").reply(200, {
        user: { id: "uuid-2", email: "prof@test.com" },
        tokens: {
          access_token: PROFESSIONAL_TOKEN,
          refresh_token: "refresh-prof",
          expires_in: 604799,
        },
      });

      await useAuthStore.getState().login("prof@test.com", "Senha@123");

      expect(useAuthStore.getState().user?.roles).toEqual([
        "CLIENT",
        "PROFESSIONAL",
      ]);
    });
  });

  describe("updateEmail", () => {
    it("PATCHes /profile/update-email/me, persists new tokens and updates user email", async () => {
      useAuthStore.setState({
        user: { id: "uuid-2", email: "old@test.com", roles: ["CLIENT", "PROFESSIONAL"] },
        isAuthenticated: true,
      });

      mock.onPatch("/profile/update-email/me").reply(200, {
        user: { id: "uuid-2", email: "novo@test.com" },
        tokens: {
          access_token: PROFESSIONAL_TOKEN,
          refresh_token: "refresh-new-email",
          expires_in: 604799,
        },
      });

      await useAuthStore.getState().updateEmail("novo@test.com");

      expect(JSON.parse(mock.history.patch[0].data)).toEqual({ email: "novo@test.com" });
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith("vupth_access_token", PROFESSIONAL_TOKEN);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith("vupth_refresh_token", "refresh-new-email");

      const state = useAuthStore.getState();
      expect(state.user?.email).toBe("novo@test.com");
      expect(state.user?.roles).toEqual(["CLIENT", "PROFESSIONAL"]);
    });

    it("throws and keeps user when backend rejects (e.g. role CLIENT required)", async () => {
      useAuthStore.setState({
        user: { id: "uuid-2", email: "old@test.com", roles: ["PROFESSIONAL"] },
        isAuthenticated: true,
      });

      mock.onPatch("/profile/update-email/me").reply(403);

      await expect(useAuthStore.getState().updateEmail("novo@test.com")).rejects.toThrow();
      expect(useAuthStore.getState().user?.email).toBe("old@test.com");
    });
  });

  describe("updatePassword", () => {
    it("PATCHes /profile/update-password/me and persists new tokens", async () => {
      useAuthStore.setState({
        user: { id: "uuid-2", email: "prof@test.com", roles: ["CLIENT", "PROFESSIONAL"] },
        isAuthenticated: true,
      });

      mock.onPatch("/profile/update-password/me").reply(200, {
        user: { id: "uuid-2", email: "prof@test.com" },
        tokens: {
          access_token: PROFESSIONAL_TOKEN,
          refresh_token: "refresh-new-pwd",
          expires_in: 604799,
        },
      });

      await useAuthStore.getState().updatePassword("NovaSenha@123");

      expect(JSON.parse(mock.history.patch[0].data)).toEqual({ password: "NovaSenha@123" });
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith("vupth_access_token", PROFESSIONAL_TOKEN);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith("vupth_refresh_token", "refresh-new-pwd");
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
  });

  describe("refreshToken", () => {
    it("updates tokens and roles after gaining OWNER role", async () => {
      useAuthStore.setState({
        user: { id: "uuid-1", email: "owner@test.com", roles: ["CLIENT"] },
        isAuthenticated: true,
      });

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("old-refresh");

      mock.onPost("/auth/refresh").reply(200, {
        access_token: OWNER_TOKEN,
        refresh_token: "new-refresh",
      });

      await useAuthStore.getState().refreshToken();

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "vupth_access_token",
        OWNER_TOKEN
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "vupth_refresh_token",
        "new-refresh"
      );

      expect(useAuthStore.getState().user?.roles).toEqual([
        "CLIENT",
        "OWNER",
      ]);
    });

    it("does nothing when no refresh token stored", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await useAuthStore.getState().refreshToken();

      expect(mock.history.post.length).toBe(0);
    });
  });

  describe("logout", () => {
    it("calls POST /auth/logout, clears tokens and resets all stores", async () => {
      useAuthStore.setState({
        user: { id: "uuid-1", email: "test@test.com", roles: ["CLIENT"] },
        isAuthenticated: true,
      });

      mock.onPost("/auth/logout").reply(204);

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
      expect(mockEstablishmentReset).toHaveBeenCalled();
      expect(mockProfessionalReset).toHaveBeenCalled();
      expect(mockAttendanceReset).toHaveBeenCalled();
    });

    it("still clears local state even if logout API fails", async () => {
      useAuthStore.setState({
        user: { id: "uuid-1", email: "test@test.com", roles: ["CLIENT"] },
        isAuthenticated: true,
      });

      mock.onPost("/auth/logout").networkError();

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe("loadStoredTokens", () => {
    it("restores session when valid token exists", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(OWNER_TOKEN);

      await useAuthStore.getState().loadStoredTokens();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.roles).toEqual(["CLIENT", "OWNER"]);
      expect(state.isLoading).toBe(false);
    });

    it("stays unauthenticated when no token stored", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await useAuthStore.getState().loadStoredTokens();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });
});
