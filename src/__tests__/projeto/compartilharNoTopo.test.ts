import fs from "fs";
import path from "path";

// compartilhar-no-topo (Andre, 05/10): o compartilhar fica no canto direito do
// cabecalho da tela de status — a Fila do profissional e o Inicio do dono —, com
// o texto do Client em todos os pontos de compartilhar.
const RAIZ = path.resolve(__dirname, "../../..");
const ler = (p: string) => fs.readFileSync(path.join(RAIZ, p), "utf8");

describe("compartilhar no topo", () => {
  it("a Fila compartilha o link do profissional", () => {
    const tela = ler("app/(professional)/queue.tsx");
    expect(tela).toContain("<CompartilharNoTopo");
    expect(tela).toContain("linkDoProfissional(API_ENV, establishmentId, professional.id)");
  });

  it("o Inicio do dono compartilha o link da loja", () => {
    const tela = ler("app/(owner)/(tabs)/dashboard.tsx");
    expect(tela).toContain("<CompartilharNoTopo");
    expect(tela).toContain("linkDaLoja(API_ENV, establishment.id)");
  });

  it("todo compartilhar usa o texto do Client", () => {
    for (const p of [
      "app/(professional)/queue.tsx",
      "app/(owner)/(tabs)/dashboard.tsx",
      "app/(owner)/(tabs)/establishment-data.tsx",
      "app/(professional)/settings-account.tsx",
      "app/(professional)/settings.tsx",
    ]) {
      expect(ler(p)).toContain("mensagemDeDivulgacao(");
    }
  });
});
