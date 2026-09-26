/**
 * @jest-environment jsdom
 */
import fs from "fs";
import path from "path";

import { alertWeb, pesoWeb } from "../../../web-shims/alert";
import { pesoDoBotao } from "@lib/pesoDoBotao";

// 🔴 Andre, 25/09: "a caixa do app [deve] ser igual a da web". As duas nasceram
// iguais (08/09), mas o Design corrigiu os valores e a HIERARQUIA dos botoes
// (14/09) e so o DialogoVupth (app) recebeu. A web ficou com o fundo preto,
// padding 24, corpo 16, borda 2 e o destrutivo com borda vermelha. Este teste
// prende os dois lados aos MESMOS numeros do arquivo de design.
const RAIZ = path.resolve(__dirname, "../../..");
const ler = (p: string) => fs.readFileSync(path.join(RAIZ, p), "utf8");

describe("a caixa do app e a da web sao a mesma", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    document.getElementById("vupth-alert-style")?.remove();
  });

  it("a web decide o peso de cada botao pela MESMA regra do app", () => {
    const casos: { estilo?: "default" | "cancel" | "destructive" }[][] = [
      [{ estilo: "default" }],
      [{ estilo: "cancel" }, { estilo: "default" }],
      [{ estilo: "cancel" }, { estilo: "destructive" }],
      [{ estilo: "cancel" }, { estilo: "default" }, { estilo: "destructive" }],
    ];
    for (const botoes of casos) {
      const rn = botoes.map((b) => ({ style: b.estilo }));
      botoes.forEach((_, i) => expect(pesoWeb(rn, i)).toBe(pesoDoBotao(botoes, i)));
    }
  });

  it("com acao destrutiva, o cancelar e o solido e o destrutivo e vazado", () => {
    alertWeb("Excluir conta", "Sem volta", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive" },
    ]);
    const [cancelar, excluir] = Array.from(document.querySelectorAll(".vupth-alert-btn"));
    expect((cancelar as HTMLElement).dataset.peso).toBe("solido");
    expect((excluir as HTMLElement).dataset.peso).toBe("vazado-perigo");
  });

  it("os numeros do desenho estao nos dois lados", () => {
    const web = ler("web-shims/alert.js");
    const app = ler("src/components/DialogoVupth.tsx");
    // fundo forest 45%, card 22, gap 16, titulo 800 18 -0.4, corpo 14/20, borda 1.5
    expect(web).toContain("rgba(22,51,0,.45)");
    expect(app).toContain("#16330073");
    expect(web).toMatch(/padding: 22px/);
    expect(app).toMatch(/padding: 22/);
    expect(web).toMatch(/gap: 16px/);
    expect(web).toContain("Archivo_800ExtraBold");
    expect(app).toContain("Archivo_800ExtraBold");
    expect(web).toMatch(/letter-spacing: -0\.4px/);
    expect(web).toMatch(/font-size: 14px; line-height: 20px/);
    expect(web).toMatch(/1\.5px solid #163300/);
    expect(app).toMatch(/borderWidth: vazado \? 1\.5/);
  });
});
