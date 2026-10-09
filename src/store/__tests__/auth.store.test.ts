import MockAdapter from "axios-mock-adapter";
import * as SecureStore from "expo-secure-store";
import { api } from "@lib/api";
import { unregisterDevice } from "@lib/push";
import { useAuthStore } from "../auth.store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("@lib/push", () => ({ unregisterDevice: jest.fn().mockResolvedValue(undefined) }));

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

// Os fixtures usam o formato REAL do backend — string separada por virgula,
// com prefixo `ROLE_` (token lido de uma sessao de verdade em 2026-08-26).
// Antes montavam `["CLIENT"]`, array e sem prefixo: um contrato que o backend
// nao cumpre, e foi por isso que ninguem viu o `getRolesFromToken` devolvendo
// a string crua tipada como array.
const CLIENT_TOKEN = makeToken({
  sub: "uuid-1",
  email: "owner@test.com",
  roles: "ROLE_CLIENT",
  exp: 9999999999,
});

const OWNER_TOKEN = makeToken({
  sub: "uuid-1",
  email: "owner@test.com",
  roles: "ROLE_CLIENT,ROLE_OWNER",
  exp: 9999999999,
});

const PROFESSIONAL_TOKEN = makeToken({
  sub: "uuid-2",
  email: "prof@test.com",
  roles: "ROLE_CLIENT,ROLE_PROFESSIONAL",
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

      await useAuthStore.getState().updatePassword("SenhaAtual@123", "NovaSenha@123");

      // Breaking backend 2026-07-23: o corpo agora leva a senha ATUAL tambem.
      expect(JSON.parse(mock.history.patch[0].data)).toEqual({
        current_password: "SenhaAtual@123",
        password: "NovaSenha@123",
      });
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith("vupth_access_token", PROFESSIONAL_TOKEN);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith("vupth_refresh_token", "refresh-new-pwd");
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
  });

  // Esqueci minha senha (S7, fatia 1 do backend 2026-07-20): codigo de 6
  // digitos por e-mail, validade 15min, uso unico. Endpoints PUBLICOS — nao
  // mexem em token nem em estado de sessao.
  describe("forgotPassword", () => {
    it("POSTa /auth/forgot-password com o e-mail", async () => {
      mock.onPost("/auth/forgot-password").reply(200);

      await useAuthStore.getState().forgotPassword("prof@test.com");

      expect(mock.history.post[0].url).toBe("/auth/forgot-password");
      expect(JSON.parse(mock.history.post[0].data)).toEqual({ email: "prof@test.com" });
    });

    it("não toca em token nem autentica", async () => {
      mock.onPost("/auth/forgot-password").reply(200);

      await useAuthStore.getState().forgotPassword("prof@test.com");

      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("resetPassword", () => {
    it("POSTa /auth/reset-password com email, code e new_password (snake)", async () => {
      mock.onPost("/auth/reset-password").reply(200);

      await useAuthStore.getState().resetPassword("prof@test.com", "123456", "NovaSenha@123");

      expect(mock.history.post[0].url).toBe("/auth/reset-password");
      expect(JSON.parse(mock.history.post[0].data)).toEqual({
        email: "prof@test.com",
        code: "123456",
        new_password: "NovaSenha@123",
      });
    });

    it("rejeita no 400 (código invalido/expirado)", async () => {
      mock.onPost("/auth/reset-password").reply(400, { message: "RESET_CODE_INVALID" });

      await expect(
        useAuthStore.getState().resetPassword("prof@test.com", "000000", "NovaSenha@123")
      ).rejects.toThrow();
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
      // Cold start restaura id + email do JWT (antes vinham vazios -> e-mail em
      // branco nas Configuracoes apos reabrir o app).
      expect(state.user?.id).toBe("uuid-1");
      expect(state.user?.email).toBe("owner@test.com");
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

  describe("logout", () => {
    it("desregistra o push quando ha token salvo e encerra a sessão", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) =>
        k === "vupth_push_token" ? "expo-push-abc" : null
      );
      mock.onPost("/auth/logout").reply(200);
      useAuthStore.setState({
        user: { id: "u1", email: "a@b.c", roles: ["OWNER"] } as any,
        isAuthenticated: true,
      });

      await useAuthStore.getState().logout();

      expect(unregisterDevice).toHaveBeenCalledWith("expo-push-abc");
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("vupth_push_token");
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("vupth_access_token");
      expect(mockEstablishmentReset).toHaveBeenCalled();
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it("sem push token não chama unregisterDevice, mas ainda encerra a sessão", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      mock.onPost("/auth/logout").reply(200);
      useAuthStore.setState({ user: { id: "u1" } as any, isAuthenticated: true });

      await useAuthStore.getState().logout();

      expect(unregisterDevice).not.toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it("encerra a sessão mesmo se o POST /auth/logout falhar", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      mock.onPost("/auth/logout").reply(500);
      useAuthStore.setState({ user: { id: "u1" } as any, isAuthenticated: true });

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});

// Exclusao de conta — bloqueio de publicacao (lojas + LGPD). Contrato do backend
// (07/08), o mesmo que o client usa: DELETE /profile/delete/me com a senha atual
// no CORPO; 204 e a conta para de autenticar no request seguinte.
describe("deleteAccount", () => {
  beforeEach(() => {
    mock.reset();
    jest.clearAllMocks();
  });

  it("manda a senha no corpo do DELETE e encerra a sessao local", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) =>
      k === "vupth_push_token" ? "expo-push-abc" : null
    );
    mock.onDelete("/profile/delete/me").reply(204);
    useAuthStore.setState({ user: { id: "u1" } as any, isAuthenticated: true });

    await useAuthStore.getState().deleteAccount("minha-senha");

    const req = mock.history.delete.find((r) => r.url === "/profile/delete/me")!;
    expect(JSON.parse(req.data)).toEqual({ current_password: "minha-senha" });
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("vupth_access_token");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("vupth_refresh_token");
    expect(mockProfessionalReset).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("desregistra o push ANTES de apagar — depois o token ja nao autentica", async () => {
    const ordem: string[] = [];
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) =>
      k === "vupth_push_token" ? "expo-push-abc" : null
    );
    (unregisterDevice as jest.Mock).mockImplementation(async () => {
      ordem.push("push");
    });
    mock.onDelete("/profile/delete/me").reply(() => {
      ordem.push("delete");
      return [204];
    });

    await useAuthStore.getState().deleteAccount("s");

    expect(ordem).toEqual(["push", "delete"]);
    // e nao chama /auth/logout com um token que ja morreu
    expect(mock.history.post.some((r) => r.url === "/auth/logout")).toBe(false);
  });

  it("senha errada: propaga o erro e a sessao CONTINUA", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    mock.onDelete("/profile/delete/me").reply(401, { code: "CURRENT_PASSWORD_INVALID" });
    useAuthStore.setState({ user: { id: "u1" } as any, isAuthenticated: true });

    await expect(useAuthStore.getState().deleteAccount("errada")).rejects.toBeTruthy();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalledWith("vupth_access_token");
  });
});

// desativar-conta (contrato do Backend c0f5b17, 08/10).
describe("desativar e reativar a conta", () => {
  beforeEach(() => {
    mock.reset();
    jest.clearAllMocks();
    useAuthStore.setState({ contaDesativada: false, avisoDeReativar: null });
  });

  it("desativar: senha no corpo, push desregistrado ANTES, sessao local encerrada", async () => {
    const ordem: string[] = [];
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) =>
      k === "vupth_push_token" ? "expo-push-abc" : null
    );
    (unregisterDevice as jest.Mock).mockImplementation(async () => {
      ordem.push("push");
    });
    mock.onPost("/profile/deactivate/me").reply((config) => {
      ordem.push("deactivate");
      expect(JSON.parse(config.data)).toEqual({ current_password: "minha-senha" });
      return [204];
    });
    useAuthStore.setState({ user: { id: "u1" } as any, isAuthenticated: true });

    await useAuthStore.getState().deactivateAccount("minha-senha");

    expect(ordem).toEqual(["push", "deactivate"]);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("vupth_access_token");
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mock.history.post.some((r) => r.url === "/auth/logout")).toBe(false);
  });

  it("desativar com senha errada: propaga o erro e a sessao continua", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    mock.onPost("/profile/deactivate/me").reply(401, { code: "CURRENT_PASSWORD_INVALID" });
    useAuthStore.setState({ user: { id: "u1" } as any, isAuthenticated: true });

    await expect(useAuthStore.getState().deactivateAccount("errada")).rejects.toBeTruthy();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("login de conta desativada: entra e abre as boas-vindas (nao reativa sozinho)", async () => {
    mock.onPost("/auth/login").reply(200, {
      user: { id: "uuid-1", email: "owner@test.com" },
      tokens: { access_token: CLIENT_TOKEN, refresh_token: "r" },
      deactivated: true,
    });

    await useAuthStore.getState().login("owner@test.com", "s");

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().contaDesativada).toBe(true);
    expect(useAuthStore.getState().avisoDeReativar).toBe("boas-vindas");
    expect(mock.history.post.some((r) => r.url === "/profile/reactivate/me")).toBe(false);
  });

  it("login normal: nada de aviso", async () => {
    mock.onPost("/auth/login").reply(200, {
      user: { id: "uuid-1", email: "owner@test.com" },
      tokens: { access_token: CLIENT_TOKEN, refresh_token: "r" },
    });

    await useAuthStore.getState().login("owner@test.com", "s");

    expect(useAuthStore.getState().contaDesativada).toBe(false);
    expect(useAuthStore.getState().avisoDeReativar).toBeNull();
  });

  it("Reativar: POST /profile/reactivate/me e o aviso fecha", async () => {
    mock.onPost("/profile/reactivate/me").reply(204);
    useAuthStore.setState({ contaDesativada: true, avisoDeReativar: "boas-vindas" });

    await useAuthStore.getState().reactivateAccount();

    expect(useAuthStore.getState().contaDesativada).toBe(false);
    expect(useAuthStore.getState().avisoDeReativar).toBeNull();
  });

  it("So consultar: o aviso fecha e a conta segue desativada", () => {
    useAuthStore.setState({ contaDesativada: true, avisoDeReativar: "boas-vindas" });

    useAuthStore.getState().soConsultar();

    expect(useAuthStore.getState().contaDesativada).toBe(true);
    expect(useAuthStore.getState().avisoDeReativar).toBeNull();
  });

  it("403 ACCOUNT_DEACTIVATED no meio do uso reabre o aviso, agora como bloqueio", async () => {
    mock.onPost("/attendances").reply(403, { code: "ACCOUNT_DEACTIVATED" });

    await expect(api.post("/attendances")).rejects.toBeTruthy();

    expect(useAuthStore.getState().contaDesativada).toBe(true);
    expect(useAuthStore.getState().avisoDeReativar).toBe("bloqueado");
  });
});

// cobertura-98 (Andre, 08/10): sem usuario na memoria, as trocas de e-mail,
// senha e o refresh nao inventam um; token sem sub/email vira "".
describe("sem usuario na memoria", () => {
  beforeEach(() => {
    mock.reset();
    jest.clearAllMocks();
    useAuthStore.setState({ user: null });
  });

  const tokens = { tokens: { access_token: CLIENT_TOKEN, refresh_token: "r" } };

  it("updateEmail e updatePassword deixam o user nulo", async () => {
    mock.onPatch("/profile/update-email/me").reply(200, tokens);
    await useAuthStore.getState().updateEmail("novo@test.com");
    expect(useAuthStore.getState().user).toBeNull();

    mock.onPatch("/profile/update-password/me").reply(200, tokens);
    await useAuthStore.getState().updatePassword("a", "b");
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("updateEmail com usuario e sem e-mail na resposta usa o digitado", async () => {
    useAuthStore.setState({ user: { id: "u", email: "velho@test.com", roles: [] } });
    mock.onPatch("/profile/update-email/me").reply(200, tokens);
    await useAuthStore.getState().updateEmail("novo@test.com");
    expect(useAuthStore.getState().user?.email).toBe("novo@test.com");
  });

  it("refreshToken sem usuario deixa o user nulo", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("r-salvo");
    mock.onPost("/auth/refresh").reply(200, { access_token: CLIENT_TOKEN, refresh_token: "r2" });
    await useAuthStore.getState().refreshToken();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("token salvo sem sub nem email restaura com strings vazias", async () => {
    const semNada = makeToken({ roles: "ROLE_CLIENT" });
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) =>
      k === "vupth_access_token" ? semNada : null
    );
    await useAuthStore.getState().loadStoredTokens();
    expect(useAuthStore.getState().user).toMatchObject({ id: "", email: "" });
  });
});
