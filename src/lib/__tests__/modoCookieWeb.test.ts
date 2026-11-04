import {
  ehEscrita,
  lerCookie,
  modoCookieLigado,
  papeisDoUsuario,
  prepararPedidoCookie,
} from "../modoCookieWeb";

describe("modoCookieWeb (token-web-httponly, DEC-179)", () => {
  it("so liga na web e com a chave em true; o nativo nunca muda", () => {
    expect(modoCookieLigado("web", "true")).toBe(true);
    expect(modoCookieLigado("web", undefined)).toBe(false);
    expect(modoCookieLigado("web", "false")).toBe(false);
    expect(modoCookieLigado("android", "true")).toBe(false);
    expect(modoCookieLigado("ios", "true")).toBe(false);
  });

  it("a chave vem desligada por padrao (sem EXPO_PUBLIC_WEB_COOKIE_AUTH)", () => {
    expect(modoCookieLigado()).toBe(false);
  });

  it("le o cookie pelo nome exato, decodificado", () => {
    const c = "outro=1; vupth_csrf=a%2Bb; vupth_csrf_x=z";
    expect(lerCookie("vupth_csrf", c)).toBe("a+b");
    expect(lerCookie("nada", c)).toBeNull();
    expect(lerCookie("vupth_csrf", "")).toBeNull();
    expect(lerCookie("vupth_csrf", undefined)).toBeNull();
    expect(lerCookie("vupth_csrf", "semigual; vupth_csrf=%E0%A4%A")).toBe("%E0%A4%A");
  });

  it("escrita = POST, PUT, PATCH, DELETE", () => {
    for (const m of ["post", "PUT", "patch", "delete"]) expect(ehEscrita(m)).toBe(true);
    for (const m of ["get", "head", "options", undefined]) expect(ehEscrita(m)).toBe(false);
  });

  it("pedido: credentials, sem Bearer, CSRF so nas escritas", () => {
    const escrita = prepararPedidoCookie(
      { method: "post", headers: { Authorization: "Bearer x" } } as any,
      "vupth_csrf=tok"
    );
    expect(escrita.withCredentials).toBe(true);
    expect(escrita.headers.Authorization).toBeUndefined();
    expect(escrita.headers["X-CSRF-Token"]).toBe("tok");

    const leitura = prepararPedidoCookie({ method: "get" } as any, "vupth_csrf=tok");
    expect(leitura.withCredentials).toBe(true);
    expect(leitura.headers["X-CSRF-Token"]).toBeUndefined();

    const semCookie = prepararPedidoCookie({ method: "delete", headers: {} as any }, "");
    expect(semCookie.headers["X-CSRF-Token"]).toBeUndefined();
  });

  it("usa set/delete quando o cabecalho e um AxiosHeaders", () => {
    const h = { set: jest.fn(), delete: jest.fn() };
    prepararPedidoCookie({ method: "patch", headers: h }, "vupth_csrf=k");
    expect(h.delete).toHaveBeenCalledWith("Authorization");
    expect(h.set).toHaveBeenCalledWith("X-CSRF-Token", "k");
  });

  it("papeis do user_roles, sem os inativos e sem prefixo", () => {
    expect(
      papeisDoUsuario({
        user_roles: [
          { role_type: "OWNER", is_active: true },
          { role_type: "ROLE_CLIENT" },
          { role_type: "PROFESSIONAL", is_active: false },
          { is_active: true },
          null,
        ],
      })
    ).toEqual(["OWNER", "CLIENT"]);
    expect(papeisDoUsuario({})).toEqual([]);
    expect(papeisDoUsuario(null)).toEqual([]);
  });
});
