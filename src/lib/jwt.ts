type JwtPayload = {
  sub: string;
  email: string;
  /**
   * ⚠️ O BACKEND MANDA UMA STRING, nao um array. Token real, lido de uma
   * sessao de verdade em 2026-08-26:
   *
   *   "roles": "ROLE_OWNER,ROLE_CLIENT"
   *
   * Separado por virgula e COM o prefixo `ROLE_` — que e a `GrantedAuthority`
   * do Spring vazando pro contrato. O tipo aqui declara as duas formas porque
   * o contrato pode mudar; quem normaliza e o `getRolesFromToken`.
   */
  roles: string[] | string;
  exp: number;
};

export function decodeToken(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Papeis do token, SEMPRE como array e SEM o prefixo `ROLE_`.
 *
 * Antes isto devolvia `payload.roles` cru — ou seja, devolvia a STRING do
 * backend tipada como `string[]`. Funcionava por acidente: `roles.includes("OWNER")`
 * caia no `String.includes`, que faz busca por SUBSTRING, e
 * `"ROLE_OWNER,ROLE_CLIENT"` contem `"OWNER"`. Resposta certa pelo motivo
 * errado.
 *
 * O que isso ja custava e o que custaria:
 *  · `roles.length` (usado no `app/index.tsx`) contava CARACTERES;
 *  · `.map`/`.filter`/`.some` em `roles` lancaria TypeError na 1a execucao;
 *  · papel novo cujo nome seja substring de outro daria falso positivo.
 *
 * E ninguem via porque os TESTES montavam `roles: ["CLIENT","OWNER"]` — array,
 * sem prefixo. Validavam um contrato que o backend nao cumpre.
 */
export function getRolesFromToken(token: string): string[] {
  const bruto = decodeToken(token)?.roles;
  const lista = Array.isArray(bruto) ? bruto : (bruto ?? "").split(",");
  return lista
    .map((r) => String(r).trim().replace(/^ROLE_/, ""))
    .filter(Boolean);
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;
  return Date.now() >= payload.exp * 1000;
}
