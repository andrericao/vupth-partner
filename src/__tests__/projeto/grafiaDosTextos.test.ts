import fs from "fs";
import path from "path";

const RAIZ = path.resolve(__dirname, "../../..");
const PASTAS = ["app", "src"];

// GRAFIA DOS TEXTOS (GUIA_DE_TEXTO.md §6).
//
// "Não almocar" ficou meses no botão da pergunta da refeição, e a mesma frase
// servia para a Janta: "passa do horário do janta". O texto de tela foi escrito
// ao lado de comentários em ASCII (hábito do projeto) e herdou a falta de
// acento; revisão nenhuma pega, porque em ASCII a frase "parece" certa. O que
// pega é proibir, no código que roda, cada forma errada já encontrada.
//
// Os comentários ficam de fora de propósito: eles citam o texto errado para
// explicar o conserto, e proibir a STRING no arquivo inteiro obrigaria a
// reescrever o comentário.

const ERROS: [errado: string, certo: string][] = [
  ['"Não almocar"', '"Não almoçar"'],
  ["horário do ${nome", "um texto sem artigo (a Janta é feminina)"],
  ['"Duracao', '"Duração'],
  ["a duracao em minutos", "a duração em minutos"],
  ['"Disponivel"', '"Disponível"'],
  ['"Indisponivel"', '"Indisponível"'],
  ['"Depilacao"', '"Depilação"'],
  ['"Aplicacao de botox"', '"Aplicação de botox"'],
  ['"Hidratacao capilar"', '"Hidratação capilar"'],
  ['"Corte a maquina"', '"Corte a máquina"'],
  ['"Drenagem linfatica"', '"Drenagem linfática"'],
];

function arquivosDeCodigo(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      return entrada.name === "__tests__" || entrada.name === "node_modules" ? [] : arquivosDeCodigo(caminho);
    }
    return /\.(ts|tsx)$/.test(entrada.name) ? [caminho] : [];
  });
}

function semComentarios(codigo: string): string {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("grafia dos textos que aparecem na tela", () => {
  const codigo = PASTAS.flatMap((pasta) => arquivosDeCodigo(path.join(RAIZ, pasta))).map(
    (arquivo) => [path.relative(RAIZ, arquivo), semComentarios(fs.readFileSync(arquivo, "utf8"))] as const,
  );

  it("encontra o código a varrer (a varredura não passa por vazio)", () => {
    expect(codigo.length).toBeGreaterThan(50);
  });

  it.each(ERROS)("nenhum texto diz %s (o certo é %s)", (errado) => {
    const achados = codigo.filter(([, texto]) => texto.includes(errado)).map(([arquivo]) => arquivo);
    expect(achados).toEqual([]);
  });
});
