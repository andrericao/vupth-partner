import { decodeToken, getRolesFromToken, isTokenExpired } from "../jwt";

function makeToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

describe("jwt", () => {
  describe("decodeToken", () => {
    it("decodes a valid JWT payload", () => {
      const token = makeToken({
        sub: "uuid-123",
        email: "user@email.com",
        roles: ["CLIENT", "OWNER"],
        exp: 9999999999,
      });

      const payload = decodeToken(token);

      expect(payload).toEqual({
        sub: "uuid-123",
        email: "user@email.com",
        roles: ["CLIENT", "OWNER"],
        exp: 9999999999,
      });
    });

    it("returns null for invalid token", () => {
      expect(decodeToken("invalid")).toBeNull();
      expect(decodeToken("")).toBeNull();
    });
  });

  describe("getRolesFromToken", () => {
    it("extracts roles from token", () => {
      const token = makeToken({ roles: ["CLIENT", "OWNER", "PROFESSIONAL"] });
      expect(getRolesFromToken(token)).toEqual([
        "CLIENT",
        "OWNER",
        "PROFESSIONAL",
      ]);
    });

    it("returns empty array for invalid token", () => {
      expect(getRolesFromToken("invalid")).toEqual([]);
    });
  });

  describe("isTokenExpired", () => {
    it("returns false for future expiry", () => {
      const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
      expect(isTokenExpired(token)).toBe(false);
    });

    it("returns true for past expiry", () => {
      const token = makeToken({ exp: Math.floor(Date.now() / 1000) - 3600 });
      expect(isTokenExpired(token)).toBe(true);
    });

    it("returns true for invalid token", () => {
      expect(isTokenExpired("invalid")).toBe(true);
    });
  });
});
