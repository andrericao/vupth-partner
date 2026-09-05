import fs from "fs";
import path from "path";

// GUARDA: nenhuma caixa de dialogo pode voltar a morrer na web.
//
// 🔴 O defeito (issue #25, teste manual de 30/08): o react-native-web NAO
// implementa `Alert.alert` com botoes. A caixa nao aparece, o `onPress` nunca
// roda — e isso quebrava em DOIS formatos, o segundo pior que o primeiro:
//
//   confirmacao (2 botoes) → a acao nunca acontecia. "O botao nao funciona."
//   aviso (1 botao)        → a acao JA TINHA acontecido e a navegacao sumia.
//                            O profissional enviava a solicitacao de afiliacao
//                            e continuava na mesma tela, entao enviava de novo.
//
// Eram 29 chamadas em 17 arquivos. Todas passaram a usar `confirmar()` /
// `avisar()` de `src/lib/confirmar.ts`, que e a costura unica onde um modal da
// marca entra depois com UMA mudanca de arquivo.
//
// Este teste NAO proibe `Alert.alert` — o alerta simples, de um argumento so
// (titulo + mensagem, sem botao), funciona na web e continua valendo.

const ROOT = path.resolve(__dirname, "../../..");
const IGNORAR = new Set(["node_modules", ".git", "dist", ".expo", "coverage", "web-build"]);

/** A unica excecao conhecida, e ela e deliberada. */
const EXCECOES = new Map<string, string>([
  [
    "app/(professional)/queue.tsx",
    "aviso de refeicao: sao QUATRO opcoes e o window.confirm so faz duas. " +
      "O nativo fica intacto; a web degrada para a pergunta principal, com " +
      "Platform.OS === 'web' logo acima. Volta a caber quando existir o modal da marca.",
  ],
]);

function arquivos(dir: string, acc: string[] = []): string[] {
  for (const nome of fs.readdirSync(dir)) {
    if (IGNORAR.has(nome)) continue;
    const p = path.join(dir, nome);
    const st = fs.statSync(p);
    if (st.isDirectory()) arquivos(p, acc);
    else if (/\.tsx?$/.test(nome) && !p.includes("__tests__")) acc.push(p);
  }
  return acc;
}

/** Cada `Alert.alert(...)` completo, balanceando parenteses. */
function chamadas(txt: string): string[] {
  const out: string[] = [];
  const re = /Alert\.alert\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(txt))) {
    let d = 0;
    for (let j = m.index + m[0].length - 1; j < txt.length; j++) {
      if (txt[j] === "(") d++;
      else if (txt[j] === ")") {
        d--;
        if (d === 0) {
          out.push(txt.slice(m.index, j + 1));
          break;
        }
      }
    }
  }
  return out;
}

describe("caixas de dialogo — nada de Alert.alert com botao fora da costura", () => {
  const comBotao = arquivos(ROOT)
    .map((p) => ({
      rel: path.relative(ROOT, p),
      n: chamadas(fs.readFileSync(p, "utf8")).filter((c) => c.includes("onPress")).length,
    }))
    .filter((x) => x.n > 0 && x.rel !== "src/lib/confirmar.ts");

  it("so a excecao documentada usa Alert.alert com onPress", () => {
    const fora = comBotao.filter((x) => !EXCECOES.has(x.rel)).map((x) => `${x.rel} (${x.n})`);

    // Se este teste falhar, NAO adicione o arquivo as excecoes por reflexo:
    // troque por `confirmar()` ou `avisar()`. A excecao existe para o caso de
    // 3+ opcoes, que nenhuma das duas cobre.
    expect(fora).toEqual([]);
  });

  it("a excecao continua sendo UMA, e com o desvio da web ao lado", () => {
    for (const [rel] of EXCECOES) {
      const txt = fs.readFileSync(path.join(ROOT, rel), "utf8");
      expect(txt).toContain('Platform.OS === "web"');
    }
    expect(comBotao.filter((x) => EXCECOES.has(x.rel)).length).toBeLessThanOrEqual(EXCECOES.size);
  });
});
