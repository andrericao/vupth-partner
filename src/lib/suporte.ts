import { Linking } from "react-native";

// botao-suporte (Andre, 11/10 e 15/10): "Em Configuracoes deve haver o botao
// Suporte, que leva a outro projeto, onde ele pesquisa o que quiser". O site
// e o repositorio vupth-support, mantido pela equipe Suporte. O endereco fica
// numa constante, para trocar quando houver dominio proprio.

/** O site de suporte (Cloudflare Pages). */
export const SUPORTE_URL = "https://vupth-support.pages.dev/";

export type PerfilDoSuporte = "profissional" | "dono";

/**
 * O link do Suporte para quem esta logado: "cada um levando pro respectivo
 * perfil" (Andre, 15/10). A home de cada perfil veio com o home-por-perfil
 * do Suporte (09c5de7): /profissional e /dono.
 */
export function linkDoSuporte(perfil: PerfilDoSuporte): string {
  return `${SUPORTE_URL}${perfil}`;
}

/** Abre o site de suporte no navegador; falhou, nao derruba a tela. */
export async function abrirSuporte(perfil: PerfilDoSuporte): Promise<void> {
  try {
    await Linking.openURL(linkDoSuporte(perfil));
  } catch {
    // sem navegador: nada a fazer na tela
  }
}
