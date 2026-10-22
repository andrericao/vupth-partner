import type { ApiEnv } from "@lib/apiEnv";

// baixar-do-parceiro (Andre, 11/10): "so vale oferecer para Android, pois nao
// criamos para iOS, e o link deve levar certo para o cliente e para parceiros".
// O mesmo desenho do Client (link-de-divulgacao, 05/10): o site redireciona
// `/baixar` para o APK mais novo no bucket R2 de producao (public/_redirects),
// que o tools/apk-para-o-r2.sh sobe depois de cada build prod-apk.

/** O APK do parceiro no bucket (o do cliente e apk/vupth.apk). */
export const APK_PARCEIRO = "apk/vupth-parceiro.apk";

/**
 * O APK do parceiro ja esta no R2? So o Andre o sobe (build prod-apk +
 * tools/apk-para-o-r2.sh). Ate la a faixa fica escondida: o /baixar daria 404.
 */
export const APK_NO_AR = true;

/** iPhone/iPad: nao ha app para iOS, entao a faixa "Baixar o app" nao aparece. */
export function ehIOS(userAgent: string | undefined | null): boolean {
  return /iPhone|iPad|iPod/i.test(userAgent ?? "");
}

/** O site web do Partner: producao na main, preview na dev. */
export function raizDoSitePartner(env: ApiEnv): string {
  return env === "prod" ? "https://vupth-partner.pages.dev" : "https://dev.vupth-partner.pages.dev";
}

/** O endereco fixo do APK: quando houver Play Store, so o destino do /baixar muda. */
export function linkDeBaixar(raiz: string): string {
  return `${raiz.replace(/\/+$/, "")}/baixar`;
}
