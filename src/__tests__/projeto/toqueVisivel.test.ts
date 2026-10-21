import fs from "fs";
import path from "path";

// 🔴 Teste de device do Andre (24/09): "a experiência de clique do botão pausar
// e finalizar não mostram que o botão foi clicado, pode haver uma mudança de
// tom de cor na hora do clique".
//
// O estado pressionado EXISTIA, mas não se via: o Finalizar ia de forest
// (#163300) para forestSoft (#223D0D), quase a mesma cor; e o verde principal
// ia de `green` para `success`, que são o MESMO #9FE870 — não mudava nada.
// A regra que sai daqui: todo botão escurece/clareia de forma perceptível ao
// toque — opacidade, que vale sobre qualquer fundo.
const RAIZ = path.resolve(__dirname, "../../..");
const ler = (p: string) => fs.readFileSync(path.join(RAIZ, p), "utf8");

describe("todo botão mostra que foi tocado", () => {
  it("cada variant do NwButton tem opacidade no pressionado", () => {
    const src = ler("src/components/nw/Button.tsx");
    const box = src.slice(src.indexOf("const BOX"), src.indexOf("const LABEL"));
    const linhas = box.match(/^\s+\w+: "[^"]*",?$/gm) ?? [];
    expect(linhas.length).toBeGreaterThanOrEqual(9);
    for (const l of linhas) expect(l).toMatch(/active:opacity-\d+/);
  });

  // O retorno ao toque tem dois sinais: a opacidade (visivel sobre qualquer fundo) e
  // a escala, que mostra que o botao "afundou". As duas bases (pilula e ghost) a tem.
  it("a pilula e o ghost encolhem um pouco ao toque", () => {
    const src = ler("src/components/nw/Button.tsx");
    expect(src).toMatch(/const BASE = "[^"]*active:scale-\[0\.97\]"/);
    expect(src).toMatch(/const BASE_GHOST = "[^"]*active:scale-\[0\.97\]"/);
  });

  it("os botões antigos (Gluestack) saíram — não há um segundo botão para esquecer", () => {
    // Migração concluída em 25/09: o NwButton é o único botão do app.
    for (const f of ["src/components/Button.tsx", "src/components/brand/Button.tsx"]) {
      expect(fs.existsSync(path.join(RAIZ, f))).toBe(false);
    }
  });
});
