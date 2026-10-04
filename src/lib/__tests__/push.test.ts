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
  ehDeDecisao,
  avisoDoPush,
  tocouNoOk,
  CATEGORIA_CIENCIA,
  ACAO_OK,
  CANAL_ALERTAS,
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

// historico-de-vinculo (DEC-19, Backend 7e3e21b): os 4 pushes de vinculo. O
// aceite e a recusa chegam a quem iniciou — o dono (convite) ou o profissional
// (pedido); a loja do push diz qual: se e a loja do dono, vai para Solicitacoes.
describe("notificationRoute — vinculo", () => {
  const LOJA = "estab-1";

  it("pedido de vinculo leva o dono as Solicitacoes da loja", () => {
    expect(notificationRoute({ type: "AFFILIATION_REQUESTED", establishmentId: LOJA })).toBe(
      "/(owner)/affiliations?establishmentId=estab-1"
    );
  });

  it("convite leva o profissional ao Vinculo", () => {
    expect(notificationRoute({ type: "AFFILIATION_INVITED", establishmentId: LOJA })).toBe(
      "/(professional)/settings-vinculo"
    );
  });

  it("aceite e recusa na loja do dono (ele convidou) vao para as Solicitacoes", () => {
    for (const type of ["AFFILIATION_ACCEPTED", "AFFILIATION_REJECTED"]) {
      expect(notificationRoute({ type, establishmentId: LOJA }, LOJA)).toBe(
        "/(owner)/affiliations?establishmentId=estab-1"
      );
    }
  });

  it("aceite e recusa em outra loja (o profissional pediu) vao para o Vinculo", () => {
    for (const type of ["AFFILIATION_ACCEPTED", "AFFILIATION_REJECTED"]) {
      expect(notificationRoute({ type, establishmentId: LOJA }, "outra")).toBe(
        "/(professional)/settings-vinculo"
      );
      expect(notificationRoute({ type, establishmentId: LOJA })).toBe(
        "/(professional)/settings-vinculo"
      );
    }
  });

  it("pedido sem a loja no push nao navega", () => {
    expect(notificationRoute({ type: "AFFILIATION_REQUESTED" })).toBeNull();
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

// 🔴 A6: "nenhuma notificação chegou, nos DOIS apps". Durante semanas isso foi
// investigado no escuro porque a aquisição do token é SILENCIOSA — o hook
// engole a exceção ("push nunca deve derrubar o login", e continua verdade) e
// nada sai na tela.
//
// O relato de estado separa causas que têm o mesmo sintoma e moram em lugares
// diferentes: permissão negada é do APARELHO; "a chamada nativa falhou" é o
// Firebase ausente, que se resolve na CONTA do Expo.
describe("acquireExpoPushToken — o relato para o painel", () => {
  const env = (over: any = {}) => ({
    isDevice: true,
    getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
    requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
    getExpoPushTokenAsync: jest.fn(async () => ({ data: "ExponentPushToken[abc]" })),
    projectId: "p1",
    ...over,
  });

  it("emulador/web: diz que não é aparelho, e nem pede permissão", async () => {
    const onEstado = jest.fn();
    const e = env({ isDevice: false, onEstado });

    await acquireExpoPushToken(e as any);

    expect(onEstado).toHaveBeenCalledWith("sem-aparelho");
    expect(e.getPermissionsAsync).not.toHaveBeenCalled();
  });

  it("permissão negada: diz isso, e não confunde com falha técnica", async () => {
    const onEstado = jest.fn();
    await acquireExpoPushToken(
      env({
        onEstado,
        getPermissionsAsync: async () => ({ status: "denied" }),
        requestPermissionsAsync: async () => ({ status: "denied" }),
      }) as any
    );

    expect(onEstado).toHaveBeenCalledWith("sem-permissao", "denied");
  });

  it("🔴 a chamada nativa estourando: relata E RELANÇA", async () => {
    // É o sintoma do Firebase ausente. Relançar importa: quem chama já trata, e
    // engolir aqui mudaria o comportamento de quem depende do throw.
    const onEstado = jest.fn();
    const promessa = acquireExpoPushToken(
      env({
        onEstado,
        getExpoPushTokenAsync: async () => {
          throw new Error("Default FirebaseApp is not initialized");
        },
      }) as any
    );

    await expect(promessa).rejects.toThrow(/Firebase/);
    expect(onEstado).toHaveBeenCalledWith("falhou", expect.stringContaining("Firebase"));
  });

  it("Expo respondendo sem token conta como falha, não como sucesso vazio", async () => {
    const onEstado = jest.fn();
    await acquireExpoPushToken(env({ onEstado, getExpoPushTokenAsync: async () => ({ data: null }) }) as any);

    expect(onEstado).toHaveBeenCalledWith("falhou", expect.any(String));
  });

  it("caminho feliz: diz que obteve", async () => {
    const onEstado = jest.fn();
    const token = await acquireExpoPushToken(env({ onEstado }) as any);

    expect(token).toBe("ExponentPushToken[abc]");
    expect(onEstado).toHaveBeenCalledWith("obtido");
  });

  it("sem onEstado, nada quebra — o relato é opcional", async () => {
    await expect(acquireExpoPushToken(env() as any)).resolves.toBeTruthy();
  });
});

// notificacao-de-ciencia (Andre, 02/10): a que so informa ganha um jeito de
// fechar (OK); a de decisao segue com a tela dela.
describe("notificacao de ciencia", () => {
  it("decisao: pedido de corte e o 'quer fechar?' — o resto e ciencia", () => {
    expect(ehDeDecisao("CUT_REQUESTED")).toBe(true);
    expect(ehDeDecisao("CLOSING_PROMPT")).toBe(true);
    expect(ehDeDecisao("ATTENDANCE_CANCELLED")).toBe(false);
    expect(ehDeDecisao("CUT_EXPIRED")).toBe(false);
    expect(ehDeDecisao(undefined)).toBe(false);
  });

  it("com o app aberto, a de ciencia vira aviso com o titulo e o texto", () => {
    expect(avisoDoPush({ title: "Cliente desistiu", body: "Ana saiu da fila" })).toEqual({
      titulo: "Cliente desistiu",
      mensagem: "Ana saiu da fila",
    });
    expect(avisoDoPush({ title: null, body: "Oi" })).toEqual({ titulo: "VUPTH", mensagem: "Oi" });
    expect(avisoDoPush({ title: " ", body: "" })).toBeNull();
    expect(avisoDoPush({})).toBeNull();
  });

  it("o botao OK da notificacao so fecha — nao abre tela", () => {
    expect(CATEGORIA_CIENCIA).toBe("CIENCIA");
    expect(CANAL_ALERTAS).toBe("alertas");
    expect(tocouNoOk({ actionIdentifier: ACAO_OK })).toBe(true);
    expect(tocouNoOk({ actionIdentifier: "expo.modules.notifications.actions.DEFAULT" })).toBe(false);
  });
});
