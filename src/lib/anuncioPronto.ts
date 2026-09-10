import * as SecureStore from "expo-secure-store";

// O anúncio de "cadastro completo — já pode atender".
//
// 🔴 Pedido dele (10/09): "anúncio de que o estabelecimento já pode atender
// deve ser um MODAL".
//
// Hoje é uma faixa verde dentro do CompletionCard, e ela fica lá **para
// sempre** — enquanto o "Perfil completo" não estiver em 100%, o card continua
// na tela anunciando algo que já aconteceu. Notícia que não sai de cena deixa
// de ser notícia: vira decoração, e a pessoa para de ler o card inteiro.
//
// Modal resolve as duas pontas: aparece UMA vez, com OK, no momento em que o
// fato acontece — e some depois.
const CHAVE = "vupth_anuncio_pronto";

/** Já anunciamos para este perfil? A chave separa dono de profissional. */
export async function jaAnunciou(perfil: "dono" | "profissional"): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(`${CHAVE}_${perfil}`)) === "1";
  } catch {
    // Sem storage, prefere NÃO repetir o anúncio: chato é pior que ausente.
    return true;
  }
}

export async function marcarAnunciado(perfil: "dono" | "profissional"): Promise<void> {
  try {
    await SecureStore.setItemAsync(`${CHAVE}_${perfil}`, "1");
  } catch {
    // Silencioso: falhar em lembrar não pode impedir o app de seguir.
  }
}

/**
 * O anúncio deve acontecer agora?
 *
 * Só quando o básico está em 100% E ainda não foi anunciado. Deliberadamente
 * NÃO depende do "Perfil completo": o que se anuncia é "você já pode atender",
 * e isso é verdade com o básico pronto — foi por confundir os dois que a faixa
 * ficava eterna.
 */
export function deveAnunciar(percentBasico: number, jaAnunciado: boolean): boolean {
  return percentBasico === 100 && !jaAnunciado;
}
