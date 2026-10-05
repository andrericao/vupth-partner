import { Platform, Share } from "react-native";
import type { ApiEnv } from "@lib/apiEnv";

// Links publicos da loja e do profissional, abertos no app web do CLIENTE.
// Formato combinado com o Client em 26/09 (84983b0c). Visitante sem login abre
// os dois — a loja e os precos sao publicos. Abrir direto no app instalado
// (app link) fica para depois: e configuracao de build.

export function baseDoWebCliente(env: ApiEnv): string {
  return env === "prod" ? "https://vupth.pages.dev" : "https://dev.vupth.pages.dev";
}

export function linkDaLoja(env: ApiEnv, establishmentId: string): string {
  return `${baseDoWebCliente(env)}/loja/${establishmentId}`;
}

export function linkDoProfissional(env: ApiEnv, establishmentId: string, professionalId: string): string {
  return `${linkDaLoja(env, establishmentId)}?profissional=${professionalId}`;
}

/**
 * O texto do compartilhar, o mesmo do Client (CLI:link-de-divulgacao, 05/10).
 * O link vai logo depois, no compartilharLink.
 */
export function mensagemDeDivulgacao(loja: string | null | undefined, profissional?: string | null): string {
  const l = loja?.trim();
  const p = profissional?.trim();
  if (p && l) return `Conheça o ${p} na ${l} — veja a fila e os serviços no VUPTH:`;
  if (p) return `Conheça o ${p} — veja a fila e os serviços no VUPTH:`;
  if (l) return `Conheça a ${l} no VUPTH:`;
  return "Veja a fila e os serviços no VUPTH:";
}

type Deps = {
  plataforma?: typeof Platform.OS;
  share?: (c: { title: string; message: string }) => Promise<unknown>;
  /** O navegador tem o compartilhar nativo (navigator.share)? */
  navegadorCompartilha?: boolean;
  copiar?: (texto: string) => Promise<void>;
};

/**
 * No aparelho, o compartilhar do sistema (WhatsApp, Instagram...). Na web, o
 * do navegador quando existe; senao copia o link. "falhou" = mostrar o link na
 * tela para a pessoa copiar a mao.
 */
export async function compartilharLink(
  link: string,
  texto: { titulo: string; mensagem: string },
  deps: Deps = {}
): Promise<"compartilhado" | "copiado" | "falhou"> {
  const plataforma = deps.plataforma ?? Platform.OS;
  const share = deps.share ?? ((c: { title: string; message: string }) => Share.share(c));
  const conteudo = { title: texto.titulo, message: `${texto.mensagem} ${link}` };

  if (plataforma !== "web") {
    try {
      await share(conteudo);
      return "compartilhado";
    } catch {
      return "falhou";
    }
  }

  const navegadorCompartilha =
    deps.navegadorCompartilha ?? (typeof navigator !== "undefined" && typeof navigator.share === "function");
  if (navegadorCompartilha) {
    try {
      await navigator.share({ title: texto.titulo, text: texto.mensagem, url: link });
      return "compartilhado";
    } catch {
      // cancelado ou bloqueado: cai no copiar
    }
  }
  const copiar =
    deps.copiar ??
    ((t: string) =>
      typeof navigator !== "undefined" && navigator.clipboard
        ? navigator.clipboard.writeText(t)
        : Promise.reject(new Error("sem area de transferencia")));
  try {
    await copiar(link);
    return "copiado";
  } catch {
    return "falhou";
  }
}
