import { needsRefresh } from "@lib/socketAuth";

// Monta um JWT falso so com o `exp` (o decodeToken le o payload base64 do meio).
function tokenExpiringAt(epochSeconds: number): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: "u1", email: "a@b.com", roles: [], exp: epochSeconds })
  ).toString("base64");
  return `header.${payload}.sig`;
}

const NOW = 1_700_000_000_000; // ms

describe("needsRefresh (token do socket)", () => {
  it("sem token: precisa renovar", () => {
    expect(needsRefresh(null, NOW)).toBe(true);
    expect(needsRefresh("", NOW)).toBe(true);
  });

  it("token ilegivel: precisa renovar (não da p/ confiar)", () => {
    expect(needsRefresh("nao-e-um-jwt", NOW)).toBe(true);
  });

  it("token já expirado: precisa renovar", () => {
    const t = tokenExpiringAt(NOW / 1000 - 10);
    expect(needsRefresh(t, NOW)).toBe(true);
  });

  it("token com folga larga: NAO precisa renovar", () => {
    const t = tokenExpiringAt(NOW / 1000 + 30 * 60); // +30min
    expect(needsRefresh(t, NOW)).toBe(false);
  });

  it("token dentro da margem de seguranca: renova ANTES de expirar", () => {
    // Expira em 30s; a margem padrao (2min) manda renovar agora — senao o
    // socket reconecta com um token que morre no meio da sessao.
    const t = tokenExpiringAt(NOW / 1000 + 30);
    expect(needsRefresh(t, NOW)).toBe(true);
  });

  it("margem configuravel", () => {
    const t = tokenExpiringAt(NOW / 1000 + 5 * 60); // +5min
    expect(needsRefresh(t, NOW, 60_000)).toBe(false); // margem 1min
    expect(needsRefresh(t, NOW, 10 * 60_000)).toBe(true); // margem 10min
  });
});
