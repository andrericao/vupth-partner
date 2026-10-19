import fs from "fs";
import path from "path";

const RAIZ = path.resolve(__dirname, "../../..");
const ler = (p: string) =>
  fs
    .readFileSync(path.join(RAIZ, p), "utf8")
    // Sem os comentários: eles citam o texto antigo para explicar a troca.
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

// GUIA_DE_TEXTO.md §4.9 (fila, fechar fila e refeições do Partner). A tela da
// fila não tem teste de render, então o que vale para ela é travado aqui,
// lendo o código — para a próxima edição não trazer de volta a frase longa.
const FILA = ler("app/(professional)/queue.tsx");
const OPCOES = ler("app/(professional)/queue-options.tsx");

describe("não chegou: o nome no título, uma linha de corpo e o Saiba mais do atraso", () => {
  it("usa confirmarComArtigo com o artigo de atrasos", () => {
    expect(FILA).toMatch(/confirmarComArtigo\(\{\s*titulo: `\$\{att\.clientName\} não chegou`,\s*mensagem: mensagemDoAtraso\(\),\s*artigo: "atraso",/);
    expect(FILA).not.toContain("Cliente não chegou");
  });
});

describe("fechar fila: uma linha de corpo e o Saiba mais, nas duas telas", () => {
  it.each([
    ["a fila", FILA],
    ["as opções da fila", OPCOES],
  ])("%s", (_nome, codigo) => {
    expect(codigo).toContain('"Ninguém novo entra; quem está, é atendido."');
    expect(codigo).toMatch(/confirmarComArtigo\(\{\s*titulo: "Fechar fila"[\s\S]*?artigo: "statusEFila"/);
    expect(codigo).not.toContain("Ninguém novo entra na sua fila");
  });

  // O título já diz "Fechar fila"; repetir no botão obrigava a ler as duas
  // linhas iguais para achar o verbo (regra 1 do guia: botão de uma palavra).
  it.each([
    ["a fila", FILA],
    ["as opções da fila", OPCOES],
  ])("%s: o botão é só Fechar, e o título segue Fechar fila", (_nome, codigo) => {
    expect(codigo).toMatch(/titulo: "Fechar fila"[^}]*?confirmar: "Fechar",/);
    expect(codigo).not.toMatch(/confirmar: "Fechar fila"/);
  });
});

describe("pergunta da refeição: Iniciar / Agora não / Pular hoje", () => {
  it("os botões são de uma ou duas palavras e o título vem de tituloDaRefeicao", () => {
    expect(FILA).toContain('{ text: "Iniciar", onPress: () => handleStartMeal(due) }');
    expect(FILA).toContain('{ text: "Pular hoje", style: "destructive", onPress: () => handleSkipMeal(due) }');
    expect(FILA).toContain('{ text: "Agora não", style: "cancel" }');
    expect(FILA).toContain("tituloDaRefeicao(due.description)");
    expect(FILA).not.toMatch(/Iniciar agora"/);
    expect(FILA).not.toMatch(/Hora do \$\{mealName/);
  });

  it("o corpo sem fila é '60 min. A fila espera.', não a pergunta de 40 caracteres", () => {
    expect(FILA).toContain("`${due.durationMinutes} min. A fila espera.`");
    expect(FILA).not.toContain("agora (${due.durationMinutes}min)?");
  });
});

describe("refeição que cruza o atendimento: Adiantar almoço / Adiar almoço", () => {
  it("o corpo é uma linha e os botões levam o nome da refeição, sem artigo", () => {
    expect(FILA).toContain("mensagem: `${att.clientName} (~${duracao} min) passa da hora.`");
    expect(FILA).toContain("confirmar: `Adiantar ${nome.toLowerCase()}`");
    expect(FILA).toContain("cancelar: `Adiar ${nome.toLowerCase()}`");
  });
});

describe("rótulo do cartão de atendimento: Atendendo / Pausado, sem caixa alta", () => {
  it("queue.tsx", () => {
    expect(FILA).toContain('{isPaused ? "Pausado" : "Atendendo"}');
    expect(FILA).not.toMatch(/ATENDENDO AGORA|ATENDIMENTO PAUSADO/);
  });
});

describe("fechamento: Fechar / Continuar, no aviso e na notificação", () => {
  it("o ClosingPrompt", () => {
    const codigo = ler("src/components/ClosingPrompt.tsx");
    expect(codigo).toContain('title="Fechar"');
    expect(codigo).toContain('title="Continuar"');
  });

  it("os botões da notificação são os mesmos", () => {
    const codigo = ler("src/hooks/usePushRegistration.ts");
    expect(codigo).toContain('buttonTitle: "Fechar"');
    expect(codigo).toContain('buttonTitle: "Continuar"');
    expect(codigo).not.toMatch(/Fechar agora|Continuar atendendo/);
  });
});
