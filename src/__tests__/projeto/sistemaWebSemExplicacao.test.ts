import fs from "fs";
import path from "path";

// Andre, 18/09: a tela Sistema no navegador não explica mais a diferença com o
// app (nem o Ctrl+Shift+R) — lá qualquer navegação já traz a versão nova.
// Sem os comentarios: o codigo pode EXPLICAR a decisao; o que nao pode e a
// TELA dizer isso ao usuario.
const tela = fs
  .readFileSync(path.resolve(__dirname, "../../../app/(professional)/sistema.tsx"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

describe("Sistema não explica a web", () => {
  it("não fala de Ctrl+Shift+R nem de recarregar a página", () => {
    expect(tela).not.toMatch(/Ctrl\+Shift/i);
    expect(tela).not.toMatch(/recarregue/i);
  });
});
