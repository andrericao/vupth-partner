import fs from "fs";
import path from "path";

// 🚀 Excluir conta e BLOQUEIO DE PUBLICACAO (Play Store, App Store, LGPD): as
// lojas exigem o caminho dentro do app, para qualquer conta. Este teste garante
// que o caminho existe para os DOIS papeis — a tela "Dados pessoais/cadastrais"
// e a mesma para profissional e dono — e que nao some numa refatoracao.
const RAIZ = path.resolve(__dirname, "../../..");
const ler = (p: string) => fs.readFileSync(path.join(RAIZ, p), "utf8");

describe("excluir conta tem caminho no app", () => {
  it("a tela de dados da conta abre o modal e chama o deleteAccount", () => {
    const tela = ler("app/(professional)/settings-account.tsx");
    expect(tela).toContain("<ExcluirContaModal");
    expect(tela).toContain("deleteAccount(");
    expect(tela).toContain("mensagemDaExclusao(");
    // depois de apagar, volta para a entrada — nao fica numa tela de conta morta
    expect(tela).toContain('router.replace("/(auth)"');
  });

  it("profissional e dono chegam nessa tela", () => {
    expect(ler("app/(professional)/settings.tsx")).toContain("settings-account");
    expect(ler("app/(owner)/(tabs)/menu.tsx")).toContain("settings-account");
  });
});

// desativar-conta (Andre, 08/10): "deve haver um menu em ambos os fronts para
// excluir e desativar conta" — o menu Conta, com os dois lado a lado, e o
// "Reativar / So consultar" na raiz (vale em qualquer tela).
describe("menu Conta: desativar ao lado do excluir", () => {
  it("a tela de dados da conta tem o menu Conta com Desativar e Excluir", () => {
    const tela = ler("app/(professional)/settings-account.tsx");
    expect(tela).toContain('testID="menu-conta"');
    expect(tela).toContain("<DesativarContaModal");
    expect(tela).toContain("deactivateAccount(");
    expect(tela).toContain("mensagemDaDesativacao(");
  });

  it("o Reativar mora na raiz do app", () => {
    expect(ler("app/_layout.tsx")).toContain("<ReativarContaDoApp />");
  });
});

// desativar-conta (c0f5b17, item 5): o dono apaga a loja nos dados da loja.
describe("apagar a loja tem caminho no app", () => {
  it("a tela da loja abre o modal e chama o deleteEstablishment", () => {
    const tela = ler("app/(owner)/(tabs)/establishment-data.tsx");
    expect(tela).toContain("<ApagarLojaModal");
    expect(tela).toContain("deleteEstablishment(");
    expect(tela).toContain("mensagemDaRemocaoDaLoja(");
  });
});

// passar a posse a qualquer momento (Andre, 08/10): no menu da loja.
describe("passar a posse tem caminho no app", () => {
  it("o menu da loja leva a Passar a posse, e a tela esta registrada", () => {
    expect(ler("app/(owner)/(tabs)/establishment-data.tsx")).toContain('"/(owner)/passar-posse"');
    expect(ler("app/(owner)/(tabs)/_layout.tsx")).toContain('name="passar-posse"');
    expect(ler("app/(owner)/(tabs)/passar-posse.tsx")).toContain("<PassarPosse");
  });

  it("o Vinculo mostra os convites de posse e o aviso de loja desativada", () => {
    const tela = ler("app/(professional)/settings-vinculo.tsx");
    expect(tela).toContain("<ConvitesDePosse");
    expect(tela).toContain("<AvisoLojaDesativada");
  });
});
