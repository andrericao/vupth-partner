import MockAdapter from "axios-mock-adapter";
import { api } from "@lib/api";
import {
  deviceDeletePath,
  mapPlatform,
  notificationRoute,
  acquireExpoPushToken,
  registerDevice,
  unregisterDevice,
  type PushEnv,
  pushSupported,
} from "../push";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe("pushSupported — onde vale carregar o expo-notifications", () => {
  it("app instalado (build proprio): suportado", () => {
    expect(pushSupported({ os: "android", executionEnvironment: "standalone" })).toBe(true);
    expect(pushSupported({ os: "ios", executionEnvironment: "bare" })).toBe(true);
  });

  it("Expo Go NAO: o modulo grita no import desde o SDK 53", () => {
    expect(pushSupported({ os: "android", executionEnvironment: "storeClient" })).toBe(false);
    expect(pushSupported({ os: "ios", executionEnvironment: "storeClient" })).toBe(false);
  });

  it("web NAO: nao existe modulo nativo (build por URL, D8)", () => {
    expect(pushSupported({ os: "web", executionEnvironment: "bare" })).toBe(false);
    expect(pushSupported({ os: "web" })).toBe(false);
  });

  it("ambiente desconhecido nao bloqueia (fail-open — push e best-effort)", () => {
    expect(pushSupported({ os: "android" })).toBe(true);
    expect(pushSupported({ os: "android", executionEnvironment: null })).toBe(true);
  });
});

describe("deviceDeletePath", () => {
  it("url-encoda os colchetes do token Expo (Tomcat rejeita [ ] crus no path)", () => {
    const token = "ExponentPushToken[abc123]";
    expect(deviceDeletePath(token)).toBe(
      "/devices/ExponentPushToken%5Babc123%5D"
    );
  });
});

describe("mapPlatform", () => {
  it("mantem os valores validos do backend", () => {
    expect(mapPlatform("ios")).toBe("ios");
    expect(mapPlatform("android")).toBe("android");
    expect(mapPlatform("web")).toBe("web");
  });
  it("cai em android para valores desconhecidos", () => {
    expect(mapPlatform("windows")).toBe("android");
  });
});

describe("notificationRoute", () => {
  it("roteia os tipos de fila/atendimento para a fila do profissional", () => {
    expect(notificationRoute({ type: "QUEUE_NEXT_IN_LINE" })).toBe(
      "/(professional)/queue"
    );
    expect(notificationRoute({ type: "ATTENDANCE_STARTED" })).toBe(
      "/(professional)/queue"
    );
    expect(notificationRoute({ type: "ATTENDANCE_FINISHED" })).toBe(
      "/(professional)/queue"
    );
  });
  it("roteia qualquer SWAP_* para a fila", () => {
    expect(notificationRoute({ type: "SWAP_REQUESTED" })).toBe(
      "/(professional)/queue"
    );
    expect(notificationRoute({ type: "SWAP_ACCEPTED" })).toBe(
      "/(professional)/queue"
    );
  });
  it("retorna null para tipo desconhecido ou ausente", () => {
    expect(notificationRoute({ type: "FOO" })).toBeNull();
    expect(notificationRoute({})).toBeNull();
    expect(notificationRoute(undefined)).toBeNull();
  });
});

describe("acquireExpoPushToken", () => {
  function makeEnv(overrides: Partial<PushEnv> = {}): PushEnv {
    return {
      isDevice: true,
      getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
      requestPermissionsAsync: jest
        .fn()
        .mockResolvedValue({ status: "granted" }),
      getExpoPushTokenAsync: jest
        .fn()
        .mockResolvedValue({ data: "ExponentPushToken[xyz]" }),
      projectId: "proj-1",
      ...overrides,
    };
  }

  it("retorna null em emulador/web (isDevice=false) sem pedir permissao", async () => {
    const env = makeEnv({ isDevice: false });
    expect(await acquireExpoPushToken(env)).toBeNull();
    expect(env.getPermissionsAsync).not.toHaveBeenCalled();
  });

  it("não pede permissao de novo quando já está granted", async () => {
    const env = makeEnv();
    const token = await acquireExpoPushToken(env);
    expect(token).toBe("ExponentPushToken[xyz]");
    expect(env.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(env.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: "proj-1",
    });
  });

  it("pede permissao quando ainda não concedida e obtem o token se aceitar", async () => {
    const env = makeEnv({
      getPermissionsAsync: jest
        .fn()
        .mockResolvedValue({ status: "undetermined" }),
      requestPermissionsAsync: jest
        .fn()
        .mockResolvedValue({ status: "granted" }),
    });
    const token = await acquireExpoPushToken(env);
    expect(env.requestPermissionsAsync).toHaveBeenCalled();
    expect(token).toBe("ExponentPushToken[xyz]");
  });

  it("retorna null quando o usuário nega a permissao", async () => {
    const env = makeEnv({
      getPermissionsAsync: jest
        .fn()
        .mockResolvedValue({ status: "undetermined" }),
      requestPermissionsAsync: jest
        .fn()
        .mockResolvedValue({ status: "denied" }),
    });
    const token = await acquireExpoPushToken(env);
    expect(token).toBeNull();
    expect(env.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });
});

describe("registerDevice / unregisterDevice", () => {
  let mock: MockAdapter;
  beforeEach(() => {
    mock = new MockAdapter(api);
  });
  afterEach(() => mock.restore());

  it("registra o token via POST /devices { token, platform }", async () => {
    mock.onPost("/devices").reply((config) => {
      expect(JSON.parse(config.data)).toEqual({
        token: "ExponentPushToken[xyz]",
        platform: "android",
      });
      return [200, { id: "d1", token: "ExponentPushToken[xyz]" }];
    });
    await expect(
      registerDevice("ExponentPushToken[xyz]", "android")
    ).resolves.toBeUndefined();
  });

  it("remove o token via DELETE no path url-encodado", async () => {
    mock
      .onDelete("/devices/ExponentPushToken%5Bxyz%5D")
      .reply(204);
    await expect(
      unregisterDevice("ExponentPushToken[xyz]")
    ).resolves.toBeUndefined();
  });
});
