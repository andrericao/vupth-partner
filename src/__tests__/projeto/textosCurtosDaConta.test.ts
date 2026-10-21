import fs from "fs";
import path from "path";

const RAIZ = path.resolve(__dirname, "../../..");
const ler = (p: string) =>
  fs
    .readFileSync(path.join(RAIZ, p), "utf8")
    // Sem os comentários: eles citam o texto antigo para explicar a troca.
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

// GUIA_DE_TEXTO.md §4.10 (conta, vínculo e loja do Partner). As telas não têm
// teste de render, então o que vale para elas é travado aqui, lendo o código.

describe("sair da conta: título que diz o fato, sem corpo, Sair / Cancelar", () => {
  it.each(["app/(professional)/settings.tsx", "app/(owner)/(tabs)/menu.tsx"])("%s", (arquivo) => {
    const codigo = ler(arquivo);
    const dialogo = codigo.slice(codigo.indexOf("const handleLogout"));
    expect(dialogo).toMatch(/titulo: "Sair da conta"/);
    expect(dialogo).toMatch(/mensagem: ""/);
    expect(dialogo).toMatch(/confirmar: "Sair"/);
    expect(codigo).not.toContain("Tem certeza que deseja sair");
  });
});

describe("vocabulário fixo: Excluir (conta, loja), nunca Deletar nem Apagar", () => {
  it.each([
    "src/components/ExcluirContaModal.tsx",
    "src/components/ApagarLojaModal.tsx",
    "app/(owner)/(tabs)/establishment-data.tsx",
  ])("%s", (arquivo) => {
    const codigo = ler(arquivo);
    expect(codigo).not.toMatch(/["'`>]\s*(Deletar|Apagar|Deletando|Apagando)/);
    expect(codigo).not.toMatch(/Apagar a loja/);
  });

  it("o link da loja diz Excluir loja", () => {
    expect(ler("app/(owner)/(tabs)/establishment-data.tsx")).toContain(">Excluir loja<");
  });
});

describe("convite de vínculo: o aviso se chama Aceitar convite, o botão Aceitar", () => {
  it("avisosDoVinculo.ts", () => {
    const codigo = ler("src/lib/avisosDoVinculo.ts");
    expect(codigo).toMatch(/titulo: "Aceitar convite",[\s\S]*?confirmar: "Aceitar",/);
    expect(ler("app/(professional)/settings-vinculo.tsx")).not.toContain("Aceitar vinculação");
  });
});

describe("quem é dono escolhe em duas palavras: Também atendo / Só dono", () => {
  it("also-professional.tsx", () => {
    const codigo = ler("app/(owner)/onboarding/also-professional.tsx");
    expect(codigo).toContain('title="Também atendo"');
    expect(codigo).toContain('title="Só dono"');
    expect(codigo).not.toMatch(/Sim, também|Não, apenas/);
  });
});

describe("abrir a loja sem ninguém trabalhando leva ao artigo, no terceiro botão", () => {
  it("o dashboard pergunta por confirmarComArtigo (o confirmar() sozinho não tem Saiba mais)", () => {
    const codigo = ler("app/(owner)/(tabs)/dashboard.tsx");
    expect(codigo).toContain('confirmarComArtigo({ ...aviso, artigo: "statusEFila" })');
  });
});
