import { iniciarSentry, carregarSentry } from "../sentry";

// sentry (Andre, 09/10): inerte sem DSN e nos testes; com DSN, liga com o
// ambiente e o commit, sem dado pessoal e sem rastreio de desempenho.
describe("iniciarSentry", () => {
  const sdk = () => ({ init: jest.fn() }) as any;

  it("sem DSN: nem carrega o SDK", () => {
    const carregar = jest.fn(sdk);
    expect(iniciarSentry({ dsn: "", ambiente: "staging", carregar })).toBe(false);
    expect(iniciarSentry({ dsn: null, ambiente: "staging", carregar })).toBe(false);
    expect(carregar).not.toHaveBeenCalled();
  });

  it("nos testes: nunca liga", () => {
    const carregar = jest.fn(sdk);
    expect(iniciarSentry({ dsn: "https://x@o.ingest.sentry.io/1", ambiente: "staging", emTeste: true, carregar })).toBe(false);
    expect(carregar).not.toHaveBeenCalled();
  });

  it("com DSN: liga com o ambiente e o commit", () => {
    const s = sdk();
    expect(
      iniciarSentry({ dsn: " https://x@o.ingest.sentry.io/1 ", ambiente: "prod", commit: "abc1234", carregar: () => s })
    ).toBe(true);
    expect(s.init).toHaveBeenCalledWith({
      dsn: "https://x@o.ingest.sentry.io/1",
      environment: "prod",
      release: "abc1234",
      tracesSampleRate: 0,
      sendDefaultPii: false,
    });
  });

  it("binario sem o modulo, ou init que falha: nao derruba o app", () => {
    expect(iniciarSentry({ dsn: "d", ambiente: "prod", carregar: () => null })).toBe(false);
    const quebra = { init: () => { throw new Error("native"); } } as any;
    expect(iniciarSentry({ dsn: "d", ambiente: "prod", carregar: () => quebra })).toBe(false);
  });

  it("o carregador padrao nunca lanca: devolve o SDK ou null", () => {
    expect(() => carregarSentry()).not.toThrow();
  });
});
