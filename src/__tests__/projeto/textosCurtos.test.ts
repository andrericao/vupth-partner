import * as fs from "fs";
import * as path from "path";

// textos-curtos (DEC-63, guia de texto da Design, regra 3): o corpo de aviso,
// dialogo e bloco e uma linha, ate 70 caracteres. Comentario dizendo "frase
// curta" nunca pegou nada; este teste le o codigo das telas e pega.
const RAIZ = path.resolve(__dirname, "../../../app");
const LIMITE = 70;

function telas(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return telas(p);
    return p.endsWith(".tsx") ? [p] : [];
  });
}

// mensagem: "..." · texto="..." · subtitle="..." (as chaves ${...} contam 8).
const PADRAO = /(?:mensagem:|mensagem=|texto=|subtitle=)\s*\{?\s*(?:"([^"\n]*)"|`([^`\n]*)`)/g;

describe("textos curtos", () => {
  it("nenhum corpo de aviso passa de 70 caracteres", () => {
    const longos: string[] = [];
    for (const f of telas(RAIZ)) {
      const codigo = fs.readFileSync(f, "utf-8");
      for (const m of codigo.matchAll(PADRAO)) {
        const t = (m[1] ?? m[2] ?? "").replace(/\$\{[^}]*\}/g, "XXXXXXXX");
        if (t.length > LIMITE) longos.push(`${path.relative(RAIZ, f)} (${t.length}): ${t}`);
      }
    }
    expect(longos).toEqual([]);
  });
});
