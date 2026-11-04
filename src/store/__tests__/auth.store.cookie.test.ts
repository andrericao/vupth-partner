// token-web-httponly (DEC-179): o mesmo auth store com a chave do modo cookie LIGADA.
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import * as SecureStore from "expo-secure-store";
import { api, renovarSessao } from "@lib/api";
import { useAuthStore } from "../auth.store";

jest.mock("@lib/modoCookieWeb", () => ({
  ...jest.requireActual("@lib/modoCookieWeb"),
  modoCookieLigado: () => true,
  cookiesDoNavegador: () => "vupth_csrf=csrf-1",
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("@lib/push", () => ({ unregisterDevice: jest.fn().mockResolvedValue(undefined) }));
jest.mock("@lib/ultimaFila", () => ({ limparUltimaFila: jest.fn().mockResolvedValue(undefined) }));

const mockRestore = jest.fn().mockResolvedValue(undefined);
jest.mock("@store/establishment.store", () => ({
  useEstablishmentStore: { getState: () => ({ reset: jest.fn(), restoreEstablishment: mockRestore }) },
}));
jest.mock("@store/professional.store", () => ({
  useProfessionalStore: { getState: () => ({ reset: jest.fn(), restoreProfessional: mockRestore }) },
}));
jest.mock("@store/attendance.store", () => ({
  useAttendanceStore: { getState: () => ({ reset: jest.fn() }) },
}));

const mock = new MockAdapter(api);
const mockGlobal = new MockAdapter(axios);

const USER = {
  id: "u1",
  email: "dono@test.com",
  user_roles: [
    { role_type: "OWNER", is_active: true },
    { role_type: "CLIENT", is_active: true },
  ],
};

beforeEach(() => {
  mock.reset();
  mockGlobal.reset();
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true });
});

describe("auth store no modo cookie (DEC-179)", () => {
  it("login: X-Auth-Mode: cookie, credentials, CSRF; papeis do user; nada no SecureStore", async () => {
    mock.onPost("/auth/login").reply(200, { user: USER, tokens: null, deactivated: false });

    await useAuthStore.getState().login("dono@test.com", "x");

    const req = mock.history.post[0];
    expect(req.headers?.["X-Auth-Mode"]).toBe("cookie");
    expect(req.withCredentials).toBe(true);
    expect(req.headers?.Authorization).toBeUndefined();
    expect(req.headers?.["X-CSRF-Token"]).toBe("csrf-1");
    expect(useAuthStore.getState().user).toEqual({
      id: "u1",
      email: "dono@test.com",
      roles: ["OWNER", "CLIENT"],
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it("login de conta desativada abre o Reativar", async () => {
    mock.onPost("/auth/login").reply(200, { user: USER, tokens: null, deactivated: true });
    await useAuthStore.getState().login("dono@test.com", "x");
    expect(useAuthStore.getState().avisoDeReativar).toBe("boas-vindas");
  });

  it("leitura vai com credentials e sem CSRF", async () => {
    mock.onGet("/x").reply(200, {});
    await api.get("/x");
    expect(mock.history.get[0].withCredentials).toBe(true);
    expect(mock.history.get[0].headers?.["X-CSRF-Token"]).toBeUndefined();
  });

  it("abertura: GET /profile/me restaura a sessao; 401 sem renovacao vai ao login", async () => {
    mock.onGet("/profile/me").replyOnce(200, USER);
    await useAuthStore.getState().loadStoredTokens();
    expect(useAuthStore.getState().user?.roles).toEqual(["OWNER", "CLIENT"]);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().isLoading).toBe(false);

    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true });
    mock.onGet("/profile/me").reply(401);
    mockGlobal.onPost(/\/auth\/web\/refresh$/).reply(401);
    await useAuthStore.getState().loadStoredTokens();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it("401: renova por POST /auth/web/refresh (com CSRF) e reenvia sem Bearer", async () => {
    mock.onGet("/y").replyOnce(401).onGet("/y").reply(200, { ok: true });
    mockGlobal.onPost(/\/auth\/web\/refresh$/).reply(204);

    const { data } = await api.get("/y");

    expect(data).toEqual({ ok: true });
    const r = mockGlobal.history.post[0];
    expect(r.withCredentials).toBe(true);
    expect(r.headers?.["X-CSRF-Token"]).toBe("csrf-1");
    expect(mock.history.get[1].headers?.Authorization).toBeUndefined();
  });

  it("refreshToken do store usa o mesmo voo do cookie", async () => {
    mockGlobal.onPost(/\/auth\/web\/refresh$/).reply(204);
    await useAuthStore.getState().refreshToken();
    expect(mockGlobal.history.post).toHaveLength(1);
    await expect(renovarSessao()).resolves.toEqual({ access_token: "", refresh_token: "" });
  });

  it("sair: POST /auth/web/logout", async () => {
    mock.onPost("/auth/web/logout").reply(204);
    useAuthStore.setState({ user: { id: "u1", email: "e", roles: [] }, isAuthenticated: true });
    await useAuthStore.getState().logout();
    expect(mock.history.post[0].url).toBe("/auth/web/logout");
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("trocar e-mail e senha nao guardam token no navegador", async () => {
    useAuthStore.setState({ user: { id: "u1", email: "velho@test.com", roles: ["OWNER"] } });
    mock.onPatch("/profile/update-email/me").reply(200, { user: { email: "novo@test.com" }, tokens: {} });
    await useAuthStore.getState().updateEmail("novo@test.com");
    expect(useAuthStore.getState().user?.email).toBe("novo@test.com");

    mock.onPatch("/profile/update-password/me").reply(200, { tokens: {} });
    await useAuthStore.getState().updatePassword("a", "b");
    expect(useAuthStore.getState().user).toEqual({ id: "u1", email: "novo@test.com", roles: ["OWNER"] });
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});
