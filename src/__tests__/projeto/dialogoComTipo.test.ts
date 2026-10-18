import fs from "fs";
import path from "path";

// modais-de-alerta (design-modais, 17/10): fechamento e `atencao`, e o primario
// de um aviso com tipo e o verde da marca. Fechar a fila e rotina do dia e da
// para reabrir; marcar `destrutivo` pintaria o botao de vermelho, a cor de quem
// nao tem volta (DEC-50: o vermelho so entra quando a acao GERA a multa ou
// apaga).
const RAIZ = path.resolve(__dirname, "../../..");
const ler = (p: string) => fs.readFileSync(path.join(RAIZ, p), "utf8");

describe("Fechar fila nas Opcoes", () => {
  const tela = ler("app/(professional)/queue-options.tsx");
  const i = tela.indexOf('titulo: "Fechar fila"');
  const bloco = tela.slice(i, i + 900);

  it("e um aviso de atencao", () => {
    expect(i).toBeGreaterThan(-1);
    expect(bloco).toContain('tipo: "atencao"');
  });

  it("nao e destrutivo: o primario fica verde", () => {
    expect(bloco).not.toMatch(/destrutivo:\s*true/);
  });
});

describe("o DialogoVupth recebe variante, nunca cor", () => {
  it("nenhuma tela passa hex nem cor ao pedir o aviso com tipo", () => {
    const store = ler("src/store/dialogo.store.ts");
    const pedido = store.slice(store.indexOf("export type PedidoDialogo"), store.indexOf("export type DialogoNaTela"));
    expect(pedido).not.toMatch(/#[0-9A-Fa-f]{6}/);
    expect(pedido).not.toMatch(/\bcor\b|color/i);
  });
});
