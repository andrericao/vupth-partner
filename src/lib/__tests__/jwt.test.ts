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
        roles: "ROLE_OWNER,ROLE_CLIENT",
        exp: 9999999999,
      });

      const payload = decodeToken(token);

      // O decode devolve o payload CRU, sem normalizar — quem normaliza e o
      // `getRolesFromToken`. Aqui o valor tem de ser o que o backend manda.
      expect(payload).toEqual({
        sub: "uuid-123",
        email: "user@email.com",
        roles: "ROLE_OWNER,ROLE_CLIENT",
        exp: 9999999999,
      });
    });

    it("returns null for invalid token", () => {
      expect(decodeToken("invalid")).toBeNull();
      expect(decodeToken("")).toBeNull();
    });
  });

  // ⚠️ O FORMATO REAL DO BACKEND (token lido de uma sessao de verdade em
  // 2026-08-26) e uma STRING separada por virgula, COM prefixo `ROLE_`:
  //
  //   "roles": "ROLE_OWNER,ROLE_CLIENT"
  //
  // Estes testes montavam `["CLIENT","OWNER"]` — array, sem prefixo. Ou seja,
  // validavam um contrato que o backend NAO cumpre, e por isso ninguem viu que
  // `getRolesFromToken` devolvia a string crua tipada como array. Funcionava
  // por acidente: `.includes("OWNER")` caia no `String.includes`, que faz
  // busca por SUBSTRING.
  describe("getRolesFromToken", () => {
    it("normaliza o formato REAL do backend: string com virgula e prefixo", () => {
      const token = makeToken({ roles: "ROLE_OWNER,ROLE_CLIENT" });
      expect(getRolesFromToken(token)).toEqual(["OWNER", "CLIENT"]);
    });

    it("o resultado e um ARRAY de verdade — `.length` conta papel, nao letra", () => {
      const token = makeToken({ roles: "ROLE_OWNER,ROLE_CLIENT" });
      const roles = getRolesFromToken(token);
      // Cru, isto dava 24 (o tamanho da string). `app/index.tsx` usa
      // `roles.length > 0` pra decidir se ha sessao util.
      expect(roles.length).toBe(2);
      expect(Array.isArray(roles)).toBe(true);
      // E o que quebraria na 1a execucao real:
      expect(() => roles.map((r) => r.toLowerCase())).not.toThrow();
    });

    it("aguenta espaco depois da virgula", () => {
      expect(getRolesFromToken(makeToken({ roles: "ROLE_OWNER, ROLE_CLIENT" })))
        .toEqual(["OWNER", "CLIENT"]);
    });

    it("aceita tambem o array, caso o contrato mude", () => {
      const token = makeToken({ roles: ["CLIENT", "OWNER", "PROFESSIONAL"] });
      expect(getRolesFromToken(token)).toEqual([
        "CLIENT",
        "OWNER",
        "PROFESSIONAL",
      ]);
    });

    it("papel vazio nao vira item — string vazia dava [\"\"]", () => {
      expect(getRolesFromToken(makeToken({ roles: "" }))).toEqual([]);
      expect(getRolesFromToken(makeToken({ roles: "ROLE_OWNER,," }))).toEqual(["OWNER"]);
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
