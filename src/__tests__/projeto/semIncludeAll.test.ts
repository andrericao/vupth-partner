import fs from "fs";
import path from "path";

// O `?includeAll=true` contornava um corte "so lojas OPEN" do GET /establishment
// que o backend removeu em 06/09. Confirmado em PRODUCAO em 17/09: sem o
// parametro, a busca ja traz todas as lojas ativas, inclusive a recem-criada
// (que nasce CLOSED). Mante-lo so deixaria o codigo explicando um corte que nao
// existe — e convidaria alguem a "consertar" a busca de novo por ele.
const RAIZ = path.resolve(__dirname, "../../..");

function arquivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" || e.name === "docs" ? [] : arquivos(p);
    return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

describe("a busca de lojas nao manda mais includeAll", () => {
  it("nenhum arquivo do app usa o parametro", () => {
    const usos = [...arquivos(path.join(RAIZ, "app")), ...arquivos(path.join(RAIZ, "src"))]
      .filter((f) => fs.readFileSync(f, "utf8").includes("includeAll"))
      .map((f) => path.relative(RAIZ, f));
    expect(usos).toEqual([]);
  });
});
