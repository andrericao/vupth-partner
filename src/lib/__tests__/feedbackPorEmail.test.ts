import MockAdapter from "axios-mock-adapter";
import { api } from "@lib/api";
import { enviarFeedback, MENSAGEM_LIMITE, FEEDBACK_MAX } from "../feedbackPorEmail";

jest.mock("expo-constants", () => ({ __esModule: true, default: { expoConfig: { version: "1.6.0" } } }));

describe("enviarFeedback (feedback-no-app, DEC-167)", () => {
  let mock: MockAdapter;
  beforeEach(() => {
    mock = new MockAdapter(api);
  });
  afterEach(() => mock.restore());

  it("POST /feedback com text, app PARTNER, versao e aparelho; 204 = ok", async () => {
    mock.onPost("/feedback").reply(204);
    expect(await enviarFeedback("  Gostei  ")).toEqual({ ok: true });
    const corpo = JSON.parse(mock.history.post[0].data);
    expect(corpo).toMatchObject({ text: "Gostei", app: "PARTNER", app_version: "1.6.0" });
    expect(corpo.device).toBeTruthy();
    expect(corpo.email).toBeUndefined();
  });

  it("corta em 1000 e nao envia vazio", async () => {
    mock.onPost("/feedback").reply(204);
    await enviarFeedback("a".repeat(FEEDBACK_MAX + 50));
    expect(JSON.parse(mock.history.post[0].data).text).toHaveLength(FEEDBACK_MAX);
    const r = await enviarFeedback("   ");
    expect(r.ok).toBe(false);
    expect(mock.history.post).toHaveLength(1);
  });

  it("429 FEEDBACK_LIMIT: frase gentil", async () => {
    mock.onPost("/feedback").reply(429, { code: "FEEDBACK_LIMIT" });
    expect(await enviarFeedback("oi")).toEqual({ ok: false, mensagem: MENSAGEM_LIMITE });
  });

  it("sem conexao e erro generico", async () => {
    mock.onPost("/feedback").networkError();
    expect((await enviarFeedback("oi")) as any).toMatchObject({ ok: false, mensagem: expect.stringMatching(/conexão/) });
    mock.onPost("/feedback").reply(422, { code: "VALIDATION_ERROR" });
    expect((await enviarFeedback("oi")) as any).toMatchObject({ ok: false, mensagem: expect.stringMatching(/Não foi possível/) });
  });
});
