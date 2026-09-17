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
