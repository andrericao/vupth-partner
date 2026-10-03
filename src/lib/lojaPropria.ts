// S23 / PAR-7 · abrir-meu-estabelecimento — o profissional que abre a propria
// loja. O Backend nao tem rota nova: `quick-create` soma OWNER a PROFESSIONAL
// no mesmo token, e atender na loja nova e o `switchEstablishment` de sempre.
//
// O que mudou aqui: quem ja atendia em OUTRA loja era trocado sem ser
// perguntado (also-professional). Trocar de loja tira a pessoa da fila de la,
// entao agora e uma escolha.

export type VinculoNaLojaNova = "ja-atende" | "vincular" | "perguntar";

export function vinculoNaLojaNova(
  lojaAtual: string | null | undefined,
  lojaNova: string | null | undefined
): VinculoNaLojaNova {
  if (!lojaNova || lojaAtual === lojaNova) return "ja-atende";
  if (!lojaAtual) return "vincular";
  return "perguntar";
}

/** Para onde o "voltar" do cadastro da loja leva, conforme a porta de entrada. */
export function voltaDoCadastroDaLoja(from: string | undefined): string {
  return from === "professional" ? "/(professional)/settings" : "/(owner)/dashboard";
}
