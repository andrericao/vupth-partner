import fs from "fs";
import path from "path";

// 🔴 O Finalizar ficou INVISIVEL durante o atendimento (16/09), reportado
// muitas vezes como "o botao nao aparece".
//
// Sem `variant`, o NwButton usa o `primary`, que ja traz `bg-vupth-green`. O
// fundo escuro vinha por `className`, e o NativeWind resolve o conflito pela
// folha de estilo, nao pela ordem escrita — o verde vencia. Botao verde, texto
// verde, card verde: o botao existia, era clicavel, e ninguem via.
//
// A guarda e sobre o PADRAO, nao sobre a cor: a cor do Finalizar tem que vir do
// variant, nunca de um `bg-` sobrescrito no className.
const tela = fs.readFileSync(
  path.resolve(__dirname, "../../../app/(professional)/queue.tsx"),
  "utf8"
);

describe("o Finalizar e visivel", () => {
  const bloco = tela.slice(tela.indexOf('title="Finalizar"') - 40, tela.indexOf('title="Finalizar"') + 260);

  it("a cor vem do variant", () => {
    expect(bloco).toMatch(/variant=/);
  });

  it("em atendimento usa o Button/Secondary do desenho (fundo forest, rotulo brand-green)", () => {
    expect(bloco).toContain('"vupthSecondary"');
  });

  it("nao sobrescreve fundo no className — era o conflito que escondia o botao", () => {
    const cls = bloco.match(/className="([^"]*)"/)?.[1] ?? "";
    expect(cls).not.toMatch(/\bbg-/);
  });
});
