// Abrir a loja sem ninguem trabalhando.
//
// O cliente que abre o app ve a loja aberta e nenhum profissional para atender
// — e a loja "aberta" nao entrega nada. O dono nao tinha como perceber isso: o
// botao abria em silencio (a unica barreira era do backend, "pelo menos um
// profissional com servico cadastrado", que e sobre CADASTRO, nao sobre quem
// esta trabalhando AGORA).
//
// Decisao do Andre (07/09), entre tirar a opcao, esconder no menu ou avisar:
// AVISAR E DEIXAR ABRIR. O caso legitimo existe — abrir antes de a equipe
// chegar —, entao o caminho continua; o que muda e que ele deixa de ser mudo.
export type AvisoDeAbertura = {
  titulo: string;
  mensagem: string;
  confirmar: string;
  cancelar: string;
} | null;

export function avisoDeAberturaSemProfissional(
  professionals: { is_available?: boolean | null }[] | null | undefined
): AvisoDeAbertura {
  // Sem dado nao se inventa alerta: a fila ainda pode nao ter carregado, e um
  // aviso falso na primeira abertura do dia ensina o dono a ignorar avisos.
  if (!Array.isArray(professionals)) return null;

  const alguemTrabalhando = professionals.some((p) => p?.is_available === true);
  if (alguemTrabalhando) return null;

  // Uma linha (guia de texto, regras 1 a 3): o que ficou de fora — o caminho
  // normal e o profissional se marcar como disponivel, e a loja abre por
  // consequencia — mora no "Saiba mais" (artigo de status e fila).
  return {
    titulo: "Ninguém trabalhando",
    mensagem: "A loja abre sem quem atenda.",
    confirmar: "Abrir",
    cancelar: "Cancelar",
  };
}
