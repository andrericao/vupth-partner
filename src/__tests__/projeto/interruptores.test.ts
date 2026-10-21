import fs from "fs";
import path from "path";

import { coresDoTema, interruptorDoTema } from "../../theme/tema";

// DS7 (validacao de 17/10): a posicao na fila tinha o proprio trilho —
// #C9CBC9, cor que nao existe na paleta, e forest quando ligado — enquanto os
// outros tres interruptores usavam border/green. O mesmo gesto, duas cores no
// mesmo menu. Um comentario pedindo "usem o mesmo trilho" nao pegaria o quarto
// interruptor; este teste pega.
const RAIZ = path.resolve(__dirname, "../../..");

function arquivos(pasta: string): string[] {
  return fs.readdirSync(pasta, { withFileTypes: true }).flatMap((e) => {
    const caminho = path.join(pasta, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : arquivos(caminho);
    return /\.tsx$/.test(e.name) ? [caminho] : [];
  });
}

describe("interruptores", () => {
  const comSwitch = [...arquivos(path.join(RAIZ, "app")), ...arquivos(path.join(RAIZ, "src"))].filter((f) =>
    fs.readFileSync(f, "utf8").includes("<Switch")
  );

  it("o app tem interruptores para conferir (a busca nao pode virar vazia)", () => {
    expect(comSwitch.length).toBeGreaterThanOrEqual(3);
  });

  // O trilho vem de um de dois lugares: o literal da marca ou `useTema().interruptor`
  // (que acompanha o tema). O que nao pode e um terceiro, como o #C9CBC9 que a
  // posicao na fila tinha.
  it.each(comSwitch.map((f) => [path.relative(RAIZ, f), f]))(
    "%s usa o trilho da marca: border desligado, green ligado",
    (_nome, arquivo) => {
      const fonte = fs.readFileSync(arquivo, "utf8");
      const literal = fonte.includes('{ false: "#D7DDD3", true: "#9FE870" }');
      const doTema = /useTema\(\)/.test(fonte) && /\{\.\.\.interruptor\}/.test(fonte);
      expect(literal || doTema).toBe(true);
    }
  );

  it("o interruptor do tema claro e o trilho da marca: border desligado, green ligado", () => {
    expect(interruptorDoTema(coresDoTema("claro")).trackColor).toEqual({ false: "#D7DDD3", true: "#9FE870" });
  });
});
