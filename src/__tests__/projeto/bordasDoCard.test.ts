import fs from "fs";
import path from "path";

// bordas-do-card (Andre, 05/10): "adicionar profissional" — o botao ficava
// cortado na altura de 40. Agora a altura das outras pilulas (48). A cor segue
// so do variant (corDeBotao.test.ts): nada de fundo no className.
const RAIZ = path.resolve(__dirname, "../../..");
const ler = (p: string) => fs.readFileSync(path.join(RAIZ, p), "utf8");

describe("Adicionar profissional no Inicio do dono", () => {
  it("o botao tem a altura 48 das outras pilulas", () => {
    const tela = ler("app/(owner)/(tabs)/dashboard.tsx");
    const i = tela.indexOf('title="Adicionar profissional"');
    const bloco = tela.slice(i, i + 600);
    expect(bloco).toContain("h-12");
    expect(bloco).not.toContain("h-10");
  });
});
