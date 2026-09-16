import fs from "fs";
import path from "path";

// 🔴 Regra que saiu do Finalizar invisivel (16/09): COR DE BOTAO VEM DO
// VARIANT, NUNCA DE UM `bg-` SOBRESCRITO.
//
// O NwButton ja pinta o fundo pelo variant (o `primary` traz `bg-vupth-green`).
// Um `bg-` a mais no className fica CONVIVENDO com ele, e o NativeWind resolve
// o conflito pela folha de estilo — nao pela ordem em que as classes foram
// escritas. O resultado depende de detalhe de compilacao, e ja produziu um
// botao verde, com texto verde, sobre um card verde: clicavel e invisivel.
//
// A guarda varre o app INTEIRO, porque o defeito nao da erro, nao aparece no
// typecheck e passou por semanas de teste manual sem ser visto.
const RAIZ = path.resolve(__dirname, "../../..");

function arquivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" || e.name === "node_modules" ? [] : arquivos(p);
    return p.endsWith(".tsx") ? [p] : [];
  });
}

describe("cor de botao vem do variant", () => {
  it("nenhum NwButton sobrescreve o fundo no className", () => {
    const infracoes: string[] = [];
    for (const f of [...arquivos(path.join(RAIZ, "app")), ...arquivos(path.join(RAIZ, "src"))]) {
      const texto = fs.readFileSync(f, "utf8");
      for (const m of texto.matchAll(/<NwButton\b([\s\S]*?)\/>/g)) {
        // Pega o className inteiro, INCLUSIVE o que esta dentro de ${...} —
        // foi assim que o Finalizar escapou da primeira varredura.
        const cls = m[1].match(/className=(\{`[\s\S]*?`\}|"[^"]*")/)?.[1] ?? "";
        if (/(^|[\s"`:])bg-/.test(cls)) {
          const linha = texto.slice(0, m.index).split("\n").length;
          infracoes.push(`${path.relative(RAIZ, f)}:${linha}`);
        }
      }
    }
    expect(infracoes).toEqual([]);
  });
});
