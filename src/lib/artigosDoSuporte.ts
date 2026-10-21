import { abrirLink, SUPORTE_URL } from "@lib/suporte";

// "Saiba mais" (GUIA_DE_TEXTO.md regra 4, DEC-63): o texto do aviso fica de uma
// linha e a regra completa mora no Suporte. O link vai ao ARTIGO do assunto,
// nunca a home: quem toca em "Saiba mais" de "Não chegou" e cai numa busca em
// branco saiu do app e não achou nada, que é pior que não ter o link.
//
// Cada chave é um assunto do app; o valor é o caminho do artigo no site de
// Suporte (`artigos/<perfil>/<assunto>.html`, o modelo de URL estável que o
// Suporte pediu). Trocar um artigo de lugar é mexer aqui e em nenhuma tela.
export const ARTIGOS_DO_SUPORTE = {
  atraso: "parceiro/atrasos",
  statusEFila: "parceiro/status-e-fila",
  conta: "parceiro/conta",
} as const;

export type Artigo = keyof typeof ARTIGOS_DO_SUPORTE;

export function linkDoArtigo(artigo: Artigo): string {
  return `${SUPORTE_URL}artigos/${ARTIGOS_DO_SUPORTE[artigo]}.html`;
}

/** Abre o artigo no navegador do sistema (o Voltar traz de volta ao app). */
export function abrirArtigo(artigo: Artigo): Promise<void> {
  return abrirLink(linkDoArtigo(artigo));
}
