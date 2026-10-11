import fs from "fs";
import path from "path";

// bordas-do-card (Andre, 05/10): "adicionar profissional" — o botao contornado
// sumia no fundo cinza da caixa e ficava cortado na altura de 40. Fundo branco
// (separa do cinza) e a altura das outras pilulas (48).
const RAIZ = path.resolve(__dirname, "../../..");
const ler = (p: string) => fs.readFileSync(path.join(RAIZ, p), "utf8");

describe("Adicionar profissional no Inicio do dono", () => {
  it("o botao tem fundo branco e altura 48 dentro da caixa cinza", () => {
    const tela = ler("app/(owner)/(tabs)/dashboard.tsx");
    const i = tela.indexOf('title="Adicionar profissional"');
    const bloco = tela.slice(i, i + 600);
    expect(bloco).toContain("bg-vupth-background");
    expect(bloco).toContain("h-12");
    expect(bloco).not.toContain("h-10");
  });
});
