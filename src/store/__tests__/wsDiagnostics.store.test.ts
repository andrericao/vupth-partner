import { useWsDiagnosticsStore, heartbeatOf, principalOf } from "../wsDiagnostics.store";

const reset = () => useWsDiagnosticsStore.getState().reset();

describe("wsDiagnostics.store (espelha o wsDiagnosticsStore do client)", () => {
  beforeEach(reset);

  it("comeca desconectado, sem headers e sem mensagens nos dois canais", () => {
    const { public: pub, personal } = useWsDiagnosticsStore.getState();
    for (const ch of [pub, personal]) {
      expect(ch.connected).toBe(false);
      expect(ch.headers).toBeNull();
      expect(ch.messageCount).toBe(0);
      expect(ch.lastError).toBeNull();
    }
  });

  it("markConnected guarda os headers do CONNECTED e liga o canal", () => {
    useWsDiagnosticsStore.getState().markConnected("public", {
      "heart-beat": "10000,10000",
      "user-name": "03d4583f",
    });
    const ch = useWsDiagnosticsStore.getState().public;
    expect(ch.connected).toBe(true);
    expect(ch.headers?.["heart-beat"]).toBe("10000,10000");
    expect(ch.connectedAt).not.toBeNull();
  });

  it("markMessage conta por canal, sem vazar de um p/ o outro", () => {
    const s = useWsDiagnosticsStore.getState();
    s.markMessage("personal");
    s.markMessage("personal");
    s.markMessage("public");
    expect(useWsDiagnosticsStore.getState().personal.messageCount).toBe(2);
    expect(useWsDiagnosticsStore.getState().public.messageCount).toBe(1);
    expect(useWsDiagnosticsStore.getState().personal.lastMessageAt).not.toBeNull();
  });

  it("markError registra a mensagem e markClosed derruba o canal", () => {
    const s = useWsDiagnosticsStore.getState();
    s.markConnected("public", {});
    s.markError("public", "STOMP error: nope");
    expect(useWsDiagnosticsStore.getState().public.lastError).toBe("STOMP error: nope");

    s.markClosed("public");
    expect(useWsDiagnosticsStore.getState().public.connected).toBe(false);
    expect(useWsDiagnosticsStore.getState().public.closedAt).not.toBeNull();
  });

  it("markClosed NAO zera a contagem — o historico da sessao e a evidencia do teste", () => {
    const s = useWsDiagnosticsStore.getState();
    s.markMessage("public");
    s.markClosed("public");
    expect(useWsDiagnosticsStore.getState().public.messageCount).toBe(1);
  });
});

describe("leitura dos headers (o discriminador do diagnostico)", () => {
  it("heartbeatOf devolve o valor que o SERVIDOR respondeu", () => {
    expect(heartbeatOf({ "heart-beat": "10000,10000" })).toBe("10000,10000");
  });

  it("heart-beat 0,0 e o sintoma antigo (S17) — nao pode ser confundido com ausente", () => {
    expect(heartbeatOf({ "heart-beat": "0,0" })).toBe("0,0");
    expect(heartbeatOf({})).toBeNull();
    expect(heartbeatOf(null)).toBeNull();
  });

  it("principalOf mostra o user-name: sem ele a sessao subiu ANONIMA (S14)", () => {
    expect(principalOf({ "user-name": "03d4583f-aaaa" })).toBe("03d4583f-aaaa");
    expect(principalOf({})).toBeNull();
    expect(principalOf(null)).toBeNull();
  });
});
