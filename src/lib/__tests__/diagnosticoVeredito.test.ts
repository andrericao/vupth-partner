import { veredictoDoCanal, desdeQuando, sufixoDoToken } from "@lib/diagnosticoVeredito";
import type { WsChannelState } from "@store/wsDiagnostics.store";

const canal = (over: Partial<WsChannelState> = {}): WsChannelState => ({
  connected: false,
  headers: null,
  connectedAt: null,
  lastMessageAt: null,
  messageCount: 0,
  lastError: null,
  closedAt: null,
  ...over,
});

// Mesmas frases do painel do client (src/domain/ws/diagnostics.ts): o teste
// A/B entre os dois apps so vale se os dois falarem igual.
describe("veredictoDoCanal (espelha o channelVerdict do client)", () => {
  it("sem conexao e sem erro = ocioso", () => {
    expect(veredictoDoCanal("personal", canal()).level).toBe("idle");
  });

  it("erro sem conexao = falhou o handshake", () => {
    const v = veredictoDoCanal("public", canal({ lastError: "401" }));
    expect(v.level).toBe("bad");
    expect(v.message).toMatch(/handshake/);
  });

  it("canal pessoal ANONIMO e vermelho (S14)", () => {
    const v = veredictoDoCanal(
      "personal",
      canal({ connected: true, headers: { "heart-beat": "10000,10000" } })
    );
    expect(v.level).toBe("bad");
    expect(v.message).toMatch(/ANÔNIMO/);
  });

  it("canal publico anonimo NAO e erro — ele nao depende de identidade", () => {
    const v = veredictoDoCanal(
      "public",
      canal({ connected: true, headers: { "heart-beat": "10000,10000" } })
    );
    expect(v.level).toBe("ok");
  });

  it("heartbeat 0 = aviso (S17)", () => {
    const v = veredictoDoCanal(
      "personal",
      canal({ connected: true, headers: { "heart-beat": "0,0", "user-name": "abc" } })
    );
    expect(v.level).toBe("warn");
    expect(v.message).toMatch(/heartbeat \(0\)/);
  });

  it("tudo certo diz quem e e o intervalo", () => {
    const v = veredictoDoCanal(
      "personal",
      canal({ connected: true, headers: { "heart-beat": "10000,10000", "user-name": "abc" } })
    );
    expect(v).toEqual({ level: "ok", message: "Conectado como abc, heartbeat de 10s" });
  });

  it("conectado sem headers = aviso", () => {
    expect(veredictoDoCanal("public", canal({ connected: true })).level).toBe("warn");
  });
});

describe("desdeQuando", () => {
  const agora = Date.parse("2026-09-16T12:00:00Z");
  it("nunca", () => expect(desdeQuando(null, agora)).toBe("nunca"));
  it("segundos", () => expect(desdeQuando("2026-09-16T11:59:48Z", agora)).toBe("há 12s"));
  it("minutos", () => expect(desdeQuando("2026-09-16T11:57:00Z", agora)).toBe("há 3min"));
  it("horas", () => expect(desdeQuando("2026-09-16T10:00:00Z", agora)).toBe("há 2h"));
});

describe("sufixoDoToken", () => {
  it("pega os 8 ultimos antes do colchete", () => {
    expect(sufixoDoToken("ExponentPushToken[abcdefghijkl]")).toBe("efghijkl");
  });
  it("vazio = null", () => expect(sufixoDoToken(null)).toBeNull());
});
