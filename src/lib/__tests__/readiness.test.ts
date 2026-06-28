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
});
