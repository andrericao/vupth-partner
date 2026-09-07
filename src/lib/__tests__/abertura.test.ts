import { avisoDeAberturaSemProfissional } from "../abertura";

// Teste de device, 07/09: "nao faz sentido o proprietario abrir a loja sem que
// haja alguem com status de trabalhando". Decisao do Andre entre as tres saidas
// possiveis (tirar / esconder no menu / avisar): AVISAR E DEIXAR ABRIR — o caso
// legitimo existe (abrir antes de a equipe chegar), entao o caminho continua,
// so deixa de ser silencioso.
describe("avisoDeAberturaSemProfissional", () => {
  it("com alguem disponivel, nao ha o que avisar", () => {
    expect(
      avisoDeAberturaSemProfissional([{ is_available: false }, { is_available: true }])
    ).toBeNull();
  });

  it("todos indisponiveis: avisa, e o botao de confirmar assume a excecao", () => {
    const aviso = avisoDeAberturaSemProfissional([
      { is_available: false },
      { is_available: false },
    ]);

    expect(aviso).not.toBeNull();
    expect(aviso!.mensagem).toMatch(/ningu[ée]m|nenhum/i);
    // O rotulo diz que abrir e possivel — o aviso informa, nao bloqueia.
    expect(aviso!.confirmar).toMatch(/assim/i);
  });

  it("loja sem nenhum profissional tambem avisa", () => {
    expect(avisoDeAberturaSemProfissional([])).not.toBeNull();
  });

  it("payload ausente nao vira aviso falso nem crash", () => {
    expect(avisoDeAberturaSemProfissional(null)).toBeNull();
    expect(avisoDeAberturaSemProfissional(undefined)).toBeNull();
  });

  it("campo ausente conta como indisponivel — quem nao disse que trabalha, nao trabalha", () => {
    expect(avisoDeAberturaSemProfissional([{}, {}])).not.toBeNull();
  });
});
