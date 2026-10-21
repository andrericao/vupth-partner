import fs from "fs";
import path from "path";

// A barra do dono e a do profissional tem de ter a MESMA linha no escuro (escolha da
// Design, 19/10). Cada uma com o seu `borderTopWidth: 0` fixo era como a linha sumia
// de uma delas: o teste pega a volta do valor escrito a mao.
const RAIZ = path.resolve(__dirname, "../../..");
const ler = (p: string) => fs.readFileSync(path.join(RAIZ, p), "utf8");

describe.each(["app/(professional)/_layout.tsx", "app/(owner)/(tabs)/_layout.tsx"])("%s", (arquivo) => {
  const fonte = ler(arquivo);

  it("a linha da barra vem de divisorDaBarraDeAbas, com o tema", () => {
    expect(fonte).toContain("divisorDaBarraDeAbas(escuro, cores)");
  });

  it("nao escreve a largura da borda a mao", () => {
    expect(fonte).not.toMatch(/borderTopWidth:/);
  });
});
