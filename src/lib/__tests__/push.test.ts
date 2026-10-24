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
  acaoDoPush,
  carenciaDoFechamento,
  CATEGORIA_CIENCIA,
  CATEGORIA_FECHAMENTO,
  ACAO_OK,
  ACAO_FECHAR_AGORA,
  ACAO_CONTINUAR,
  ACAO_ACEITAR,
  ACAO_RECUSAR,
  CATEGORIA_ACEITAR_RECUSAR,
  CATEGORIA_CONFIRMAR_RECUSAR,
  ACAO_CONFIRMAR,
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
  // aviso-de-corte-sem-ok (Andre, 08/10): o toque no pedido de corte abria o app
  // sem levar a lugar nenhum — agora vai para a lista de pedidos.
  it("roteia o pedido de corte para Solicitacoes de corte", () => {
    expect(notificationRoute({ type: "CUT_REQUESTED" })).toBe(
      "/(professional)/cut-requests"
    );
  });
  // desativar-conta (respostas ao S41 e S42, Backend 01c785e).
  it("posse: o convite leva ao Vinculo; recusado volta a Passar a posse; aceito deixa o inicio decidir", () => {
    expect(notificationRoute({ type: "OWNERSHIP_TRANSFER_REQUESTED" })).toBe(
      "/(professional)/settings-vinculo"
    );
    expect(notificationRoute({ type: "OWNERSHIP_TRANSFER_REFUSED" })).toBe("/(owner)/passar-posse");
    expect(notificationRoute({ type: "OWNERSHIP_TRANSFER_ACCEPTED" })).toBe("/");
  });
  it("loja desativada ou reativada leva ao Vinculo", () => {
    expect(notificationRoute({ type: "ESTABLISHMENT_DEACTIVATED" })).toBe(
      "/(professional)/settings-vinculo"
    );
    expect(notificationRoute({ type: "ESTABLISHMENT_REACTIVATED" })).toBe(
      "/(professional)/settings-vinculo"
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
  // aviso-de-corte-sem-ok (Andre, 08/10): o pedido de corte ganha o OK, como o
  // "E quase a sua vez!" do Client; decidir e na tela de pedidos (o toque leva).
  it("decisao: so o 'quer fechar?' — o pedido de corte e o resto ganham OK", () => {
    expect(ehDeDecisao("CUT_REQUESTED")).toBe(false);
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

// notificacao-com-botao (PAR-11, Andre 15/10): toda notificacao tem um botao.
describe("notificacao-com-botao", () => {
  it("cada botao vira uma acao; o corpo da notificacao abre o app", () => {
    expect(CATEGORIA_FECHAMENTO).toBe("FECHAMENTO");
    expect(acaoDoPush({ actionIdentifier: ACAO_OK })).toBe("ok");
    expect(acaoDoPush({ actionIdentifier: ACAO_FECHAR_AGORA })).toBe("fechar-agora");
    expect(acaoDoPush({ actionIdentifier: ACAO_CONTINUAR })).toBe("continuar");
    expect(acaoDoPush({ actionIdentifier: ACAO_ACEITAR })).toBe("aceitar");
    expect(acaoDoPush({ actionIdentifier: ACAO_RECUSAR })).toBe("recusar");
    expect(acaoDoPush({ actionIdentifier: "expo.modules.notifications.actions.DEFAULT" })).toBe("abrir");
  });

  it("a categoria do pedido que pergunta e a combinada com o Backend (7584964)", () => {
    expect(CATEGORIA_ACEITAR_RECUSAR).toBe("ACEITAR_RECUSAR");
    expect(CATEGORIA_CONFIRMAR_RECUSAR).toBe("CONFIRMAR_RECUSAR");
    expect(acaoDoPush({ actionIdentifier: ACAO_CONFIRMAR })).toBe("aceitar");
  });

  it("o Hora de fechar? traz a carencia; os outros nao", () => {
    expect(carenciaDoFechamento({ type: "CLOSING_PROMPT", graceUntil: "2026-10-15T22:15:00Z" })).toBe(
      "2026-10-15T22:15:00Z"
    );
    expect(carenciaDoFechamento({ type: "CLOSING_PROMPT" })).toBeNull();
    expect(carenciaDoFechamento({ type: "CLOSING_PROMPT", graceUntil: "" })).toBeNull();
    expect(carenciaDoFechamento({ type: "CUT_REQUESTED", graceUntil: "x" })).toBeNull();
    expect(carenciaDoFechamento(undefined)).toBeNull();
  });

  it("o toque leva a tela certa: pagamento, fechamento e loja removida", () => {
    expect(notificationRoute({ type: "PAYMENT_CLAIMED" })).toBe("/(professional)/my-day");
    expect(notificationRoute({ type: "CLOSING_PROMPT" })).toBe("/(professional)/queue");
    expect(notificationRoute({ type: "PRICE_POLICY", policyVersion: 2 })).toBe("/(professional)/ciencia-de-preco");
    expect(notificationRoute({ type: "NO_SHOW_AVAILABLE", attendanceId: "a1" })).toBe("/(professional)/queue");
    expect(notificationRoute({ type: "ESTABLISHMENT_REMOVED" })).toBe("/(professional)/settings-vinculo");
  });

  it("Libere a sua agenda leva a agenda", () => {
    expect(notificationRoute({ type: "AGENDA_RELEASE_PROMPT", target: "agenda" })).toBe("/(professional)/agenda");
  });
});
