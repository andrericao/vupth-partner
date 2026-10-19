import fs from "fs";
import path from "path";

// 🔴 O QUE ESTE TESTE PEGA (DEC-75, modo escuro).
//
// Cor escrita a mao NAO troca de tema. Um icone `color="#163300"` fica forest
// sobre a surface forest do escuro (1:1: some), um `bg-white` vira um bloco
// branco no meio de uma tela escura, e `text-vupth-forest` e texto da cor do
// fundo. O Design avisou em 17/10 (design.html#tokens-escuros): "texto usa
// textPrimary, nao forest; hex solto nao troca de tema".
//
// Comentario dizendo "nao use hex" nunca pegou nada, entao a regra e uma
// CATRACA: `corPendente.json` guarda quantas ocorrencias cada arquivo ainda
// tem, e so pode diminuir. Arquivo novo, ou arquivo que ganha uma ocorrencia,
// reprova. Converteu um grupo de telas? Rode
//   VUPTH_ATUALIZAR_BASELINE=1 npx jest corQueNaoTrocaDeTema
// que a lista baixa sozinha (ela nunca sobe: so grava se nada piorou).
// Quando a lista esvaziar, deixe `{}`: o teste le o arquivo (apaga-lo derruba a
// suite) e ele continua barrando hex novo.
//
// `corAguardando.json` e o que PRs ainda abertas vao acrescentar quando entrarem
// (cada arquivo diz qual PR): sem ele a primeira a ser mesclada deixaria a
// `dev` vermelha por uma cor que ela escreveu antes desta catraca existir. E
// licenca transitoria: quando a PR entrar, o arquivo e convertido e a entrada
// sai. Nao conta para o "so diminui".
//
// Cor que de proposito NAO troca (texto branco sobre foto, branco sobre o
// forest, que e o mesmo hex nos dois temas...) leva um comentario
// `tema-fixo: <porque>` NA LINHA ou na linha de cima: essa linha e a seguinte
// deixam de contar, e o porque fica escrito ao lado.
const RAIZ = path.resolve(__dirname, "../../..");
const BASELINE = path.join(__dirname, "corPendente.json");
const AGUARDANDO = path.join(__dirname, "corAguardando.json");
const MARCA_DE_FIXO = "tema-fixo";

type Contagem = Partial<Record<Categoria, number>>;
type Categoria = "hex" | "textoForest" | "bordaForest" | "branco";

const PADROES: Record<Categoria, RegExp> = {
  // #RGB, #RRGGBB, #RRGGBBAA e rgb()/rgba() numericos.
  hex: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b|\brgba?\(\s*\d/g,
  textoForest: /\btext-vupth-forest\b/g,
  bordaForest: /\bborder-vupth-forest\b/g,
  branco: /\b(?:bg|text|border)-(?:white|black)\b/g,
};

/** Tira os comentarios, sem mexer no que esta dentro de aspas. */
function semComentarios(src: string): string {
  let saida = "";
  let aspa: string | null = null;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const n = src[i + 1];
    if (aspa) {
      saida += c;
      if (c === "\\") saida += src[++i] ?? "";
      else if (c === aspa) aspa = null;
    } else if (c === "'" || c === '"' || c === "`") {
      aspa = c;
      saida += c;
    } else if (c === "/" && n === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      saida += "\n";
    } else if (c === "/" && n === "*") {
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i++;
    } else {
      saida += c;
    }
  }
  return saida;
}

function arquivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    // `theme` e quem DEFINE as cores; os testes guardam hex de proposito.
    if (e.isDirectory()) return ["__tests__", "node_modules", "theme"].includes(e.name) ? [] : arquivos(p);
    return /\.tsx?$/.test(e.name) && !e.name.endsWith(".d.ts") ? [p] : [];
  });
}

/** Conta, por categoria, as ocorrencias de um arquivo (a linha `tema-fixo` e a seguinte nao contam). */
function contar(fonte: string): Contagem {
  const linhas = fonte.split("\n");
  const semFixos = linhas
    .map((linha, i) => (linha.includes(MARCA_DE_FIXO) || linhas[i - 1]?.includes(MARCA_DE_FIXO) ? "" : linha))
    .join("\n");
  const texto = semComentarios(semFixos);
  const contagem: Contagem = {};
  for (const [categoria, padrao] of Object.entries(PADROES) as [Categoria, RegExp][]) {
    const n = (texto.match(padrao) ?? []).length;
    if (n) contagem[categoria] = n;
  }
  return contagem;
}

function varrer(): Record<string, Contagem> {
  const achados: Record<string, Contagem> = {};
  for (const dir of ["app", "src"]) {
    for (const arquivo of arquivos(path.join(RAIZ, dir))) {
      const contagem = contar(fs.readFileSync(arquivo, "utf8"));
      if (Object.keys(contagem).length) achados[path.relative(RAIZ, arquivo)] = contagem;
    }
  }
  return achados;
}

let pendente: Record<string, Contagem> = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
const aguardando: Record<string, Contagem & { pr?: string }> = JSON.parse(fs.readFileSync(AGUARDANDO, "utf8"));
const atual = varrer();

function pioras(): string[] {
  const lista: string[] = [];
  for (const [arquivo, contagem] of Object.entries(atual)) {
    for (const [categoria, n] of Object.entries(contagem) as [Categoria, number][]) {
      const permitido = Math.max(pendente[arquivo]?.[categoria] ?? 0, aguardando[arquivo]?.[categoria] ?? 0);
      if (n > permitido) lista.push(`${arquivo}: ${categoria} ${n} (permitido ${permitido})`);
    }
  }
  return lista;
}

if (process.env.VUPTH_ATUALIZAR_BASELINE === "1" && pioras().length === 0) {
  fs.writeFileSync(BASELINE, JSON.stringify(atual, null, 2) + "\n");
  pendente = atual;
}

describe("cor que nao troca de tema (hex, forest como texto, branco fixo)", () => {
  it("nenhum arquivo ganha ocorrencia: use useTema().cores ou as classes que trocam de tema", () => {
    // textPrimary no lugar de text-vupth-forest; bg-vupth-background no lugar de
    // bg-white; painel para o fundo de modal; `cores.x` para icone e trackColor.
    expect(pioras()).toEqual([]);
  });

  it("a lista so diminui: converteu? rode VUPTH_ATUALIZAR_BASELINE=1 e commite", () => {
    const sobras: string[] = [];
    for (const [arquivo, contagem] of Object.entries(pendente)) {
      for (const [categoria, n] of Object.entries(contagem) as [Categoria, number][]) {
        const real = atual[arquivo]?.[categoria] ?? 0;
        if (real < n) sobras.push(`${arquivo}: ${categoria} caiu de ${n} para ${real}`);
      }
    }
    expect(sobras).toEqual([]);
  });

  it("todo arquivo da lista ainda existe", () => {
    for (const arquivo of Object.keys(pendente)) {
      expect(fs.existsSync(path.join(RAIZ, arquivo))).toBe(true);
    }
  });

  it("cada licenca de PR aberta diz qual PR e nao repete o que ja esta na lista", () => {
    for (const [arquivo, licenca] of Object.entries(aguardando)) {
      expect(licenca.pr).toMatch(/^#\d+/);
      for (const categoria of Object.keys(PADROES) as Categoria[]) {
        if (licenca[categoria] === undefined) continue;
        // Uma licenca menor ou igual ao que a lista ja permite nao serve para nada.
        expect(licenca[categoria] as number).toBeGreaterThan(pendente[arquivo]?.[categoria] ?? 0);
      }
    }
  });
});

describe("a varredura em si", () => {
  it("conta hex, rgba, forest como texto, borda forest e branco fixo", () => {
    const fonte = [
      'const a = "#163300";',
      'const b = "#fff";',
      'const c = "rgba(0,0,0,0.35)";',
      '<Text className="text-vupth-forest">x</Text>',
      '<View className="border-2 border-vupth-forest bg-white" />',
    ].join("\n");
    expect(contar(fonte)).toEqual({ hex: 3, textoForest: 1, bordaForest: 1, branco: 1 });
  });

  it("ignora comentarios, forestSoft, bg-vupth-forest e as classes que trocam de tema", () => {
    const fonte = [
      "// #163300 num comentario",
      "/* text-vupth-forest tambem */",
      '<View className="bg-vupth-forest text-vupth-forestSoft text-vupth-textPrimary bg-vupth-background" />',
      '<Text className="text-vupth-green">ok</Text>',
    ].join("\n");
    expect(contar(fonte)).toEqual({});
  });

  it("tema-fixo isenta a propria linha e a SEGUINTE, e so ela", () => {
    const fonte = [
      '<Text className="text-white">sobre a foto</Text> {/* tema-fixo: texto sobre a foto, sempre escura */}',
      '<Text className="text-white">sobre o fundo do tema</Text>',
      "// tema-fixo: sobre o forest",
      '<Text className="text-white">isento pela linha de cima</Text>',
      '<Text className="text-white">este conta</Text>',
    ].join("\n");
    expect(contar(fonte)).toEqual({ branco: 1 });
  });
});
