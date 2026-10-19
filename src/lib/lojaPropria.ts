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

export type TextosDaEscolhaDeLoja = {
  subtitulo: string;
  corpo: string;
  atender: string;
  continuar: string;
};

/**
 * Os textos de "Onde voce vai atender?" (quem ja atende em outra loja).
 *
 * O nome da loja atual aparece UMA vez, no subtitulo. Antes saia tres vezes
 * (subtitulo, corpo e botao) e, sem nome, o botao dizia "Continuar em a loja de
 * agora" — o texto de reserva era uma frase solta, nao um substantivo que
 * coubesse depois de "em".
 */
export function textosDaEscolhaDeLoja(
  lojaAtual: string | null | undefined,
  lojaNova: string | null | undefined
): TextosDaEscolhaDeLoja {
  const nova = lojaNova?.trim() || null;
  const atual = lojaAtual?.trim() || null;
  return {
    subtitulo: `Hoje você atende em ${atual ?? "outra loja"}.`,
    corpo: `Para atender ${nova ? `em ${nova}` : "na sua loja nova"}, você deixa de atender na loja atual. Dá para decidir depois, em Perfil → Vínculo.`,
    atender: nova ? `Atender em ${nova}` : "Atender na loja nova",
    continuar: "Continuar na loja atual",
  };
}
