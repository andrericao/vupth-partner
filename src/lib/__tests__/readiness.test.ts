import { waitForBackend } from "../readiness";

// Relogio controlavel: sleep avanca o tempo virtual, now le esse tempo.
function makeClock() {
  let t = 0;
  return {
    now: () => t,
    sleep: (ms: number) => {
      t += ms;
      return Promise.resolve();
    },
  };
}

const upResponse = { ok: true, json: async () => ({ status: "UP" }) };
const downResponse = { ok: true, json: async () => ({ status: "DOWN" }) };
const error503 = { ok: false, status: 503, json: async () => ({}) };

describe("waitForBackend", () => {
  it("resolves true on the first ping when readiness is UP", async () => {
    const clk = makeClock();
    const fetchImpl = jest.fn().mockResolvedValue(upResponse);

    const ok = await waitForBackend({ url: "x", fetchImpl, ...clk });

    expect(ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith("x", expect.any(Object));
  });

  it("retries on 5xx (cold start) until UP", async () => {
    const clk = makeClock();
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(error503)
      .mockResolvedValueOnce(error503)
      .mockResolvedValueOnce(upResponse);

    const ok = await waitForBackend({ url: "x", fetchImpl, initialBackoffMs: 10, ...clk });

    expect(ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("retries while the body is not UP (200 but status DOWN)", async () => {
    const clk = makeClock();
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(downResponse)
      .mockResolvedValueOnce(upResponse);

    const ok = await waitForBackend({ url: "x", fetchImpl, initialBackoffMs: 10, ...clk });

    expect(ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("treats a network error as not-ready and keeps retrying", async () => {
    const clk = makeClock();
    const fetchImpl = jest
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(upResponse);

    const ok = await waitForBackend({ url: "x", fetchImpl, initialBackoffMs: 10, ...clk });

    expect(ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("returns false when the ceiling is exceeded without ever being UP", async () => {
    const clk = makeClock();
    const fetchImpl = jest.fn().mockResolvedValue(error503);

    const ok = await waitForBackend({
      url: "x",
      fetchImpl,
      ceilingMs: 100,
      initialBackoffMs: 30,
      maxBackoffMs: 50,
      ...clk,
    });

    expect(ok).toBe(false);
    // termina (nao trava) e respeita o teto
    expect(fetchImpl.mock.calls.length).toBeGreaterThan(0);
  });

  it("usa os defaults reais (URL, Date.now e defaultSleep) resolvendo após 1 retry", async () => {
    // Sem injetar url/now/sleep: exercita os `?? DEFAULT` e o defaultSleep real.
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(error503)
      .mockResolvedValueOnce(upResponse);

    const ok = await waitForBackend({ fetchImpl, initialBackoffMs: 1 });

    expect(ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    // url default (READINESS_URL): 1o argumento e a string do endpoint
    expect(typeof fetchImpl.mock.calls[0][0]).toBe("string");
  });

  it("aborta a tentativa no timeout e conta como nao-pronto", async () => {
    const clk = makeClock();
    // fetch que so termina se o AbortController abortar (via signal).
    const fetchImpl = jest.fn().mockImplementation(
      (_url: string, init: any) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => reject(new Error("aborted")));
        })
    );

    const ok = await waitForBackend({
      url: "x",
      fetchImpl,
      attemptTimeoutMs: 5,
      ceilingMs: 1,
      initialBackoffMs: 1,
      ...clk,
    });

    expect(ok).toBe(false);
    expect(fetchImpl).toHaveBeenCalled();
  });
});
