// Os dois avisos do vínculo do profissional com a loja, em frases curtas (guia de texto,
// §4.10, e DEC-63): título que diz o fato, corpo de uma frase com o efeito e, no máximo,
// 70 caracteres. O texto de antes tinha 86 e 99 caracteres, e o de sair terminava numa
// pergunta que os dois botões já fazem.
//
// Sem o nome da loja, "em este estabelecimento" saía errado (o `em` não concorda com
// o `este`): o texto passa a dizer "nesta loja".

const onde = (nomeDaLoja?: string | null) => (nomeDaLoja ? `em ${nomeDaLoja}` : "nesta loja");

export function avisoDoConvite(nomeDaLoja?: string | null) {
  return {
    titulo: "Aceitar convite",
    mensagem: `Você passa a atender ${onde(nomeDaLoja)}.`,
    confirmar: "Aceitar",
  };
}

// A consequência fica no texto ("e de receber clientes"): é o que importa numa ação que
// o profissional não desfaz sozinho.
export function avisoDeSairDaLoja(nomeDaLoja?: string | null) {
  return {
    titulo: "Sair da loja",
    mensagem: `Você deixa de atender ${onde(nomeDaLoja)} e de receber clientes.`,
    confirmar: "Sair da loja",
  };
}
