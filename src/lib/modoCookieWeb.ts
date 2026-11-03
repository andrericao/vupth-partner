import { Platform } from "react-native";

// token-web-httponly (DEC-172/179, Backend 1ba1493): na WEB o token sai do
// armazenamento do navegador e passa a morar em cookie HttpOnly. O app nativo
// NAO muda (Bearer do SecureStore).
//
// Atras de uma chave LOCAL desligada: EXPO_PUBLIC_WEB_COOKIE_AUTH=true. So liga
// junto com o dominio proprio (DEC-155) e com a chave WEB_COOKIE_AUTH_ENABLED do
// Backend; desligada, o Backend responde 404 em /auth/web/*.
//
// Contrato:
//  · login: POST /auth/login com X-Auth-Mode: cookie; a resposta traz o user
//    sem tokens (os papeis vem em user.user_roles);
//  · todo pedido com credentials (withCredentials), sem Authorization;
//  · escritas (POST, PUT, PATCH, DELETE): o cookie vupth_csrf vai em
//    X-CSRF-Token (sem ele, 403 CSRF_INVALID);
//  · renovar: POST /auth/web/refresh (204); 401 = sessao vencida -> login;
//  · sair: POST /auth/web/logout (204).

export const CABECALHO_MODO = "X-Auth-Mode";
export const CABECALHO_CSRF = "X-CSRF-Token";
export const COOKIE_CSRF = "vupth_csrf";

/** A chave: so na web e so com EXPO_PUBLIC_WEB_COOKIE_AUTH=true. */
export function modoCookieLigado(
  plataforma: string = Platform.OS,
  chave: string | undefined = process.env.EXPO_PUBLIC_WEB_COOKIE_AUTH
): boolean {
  return plataforma === "web" && chave === "true";
}

/** O valor de um cookie legivel (o vupth_csrf), ou null. */
export function lerCookie(nome: string, cookies: string | null | undefined): string | null {
  for (const parte of (cookies ?? "").split(";")) {
    const i = parte.indexOf("=");
    if (i < 0) continue;
    if (parte.slice(0, i).trim() === nome) {
      const valor = parte.slice(i + 1).trim();
      try {
        return decodeURIComponent(valor) || null;
      } catch {
        return valor || null;
      }
    }
  }
  return null;
}

/** POST, PUT, PATCH e DELETE levam o CSRF; GET, HEAD e OPTIONS nao. */
export function ehEscrita(metodo: string | undefined): boolean {
  return ["post", "put", "patch", "delete"].includes((metodo ?? "get").toLowerCase());
}

/** Os cookies do navegador (vazio fora da web). */
export function cookiesDoNavegador(): string {
  try {
    return typeof document !== "undefined" ? document.cookie ?? "" : "";
  } catch {
    return "";
  }
}

type PedidoAxios = {
  method?: string;
  withCredentials?: boolean;
  headers?: any;
};

/** Prepara um pedido no modo cookie: credentials, sem Bearer, CSRF nas escritas. */
export function prepararPedidoCookie<T extends PedidoAxios>(pedido: T, cookies: string): T {
  pedido.withCredentials = true;
  const h = pedido.headers ?? (pedido.headers = {});
  if (typeof h.delete === "function") h.delete("Authorization");
  else delete h.Authorization;
  if (ehEscrita(pedido.method)) {
    const csrf = lerCookie(COOKIE_CSRF, cookies);
    if (csrf) {
      if (typeof h.set === "function") h.set(CABECALHO_CSRF, csrf);
      else h[CABECALHO_CSRF] = csrf;
    }
  }
  return pedido;
}

/** Os papeis do user da resposta (user_roles: [{role_type, is_active}]), sem os inativos. */
export function papeisDoUsuario(user: unknown): string[] {
  const lista = (user as { user_roles?: unknown } | null)?.user_roles;
  if (!Array.isArray(lista)) return [];
  return lista
    .filter((r) => r && r.is_active !== false && typeof r.role_type === "string")
    .map((r) => String(r.role_type).replace(/^ROLE_/, ""));
}
