import fs from "fs";
import path from "path";

// 🔴 "O menu Sistema não deve ficar no rodapé, deve ser uma opção de menu dentro
// em configurações" (11/09).
//
// Ele entrou ABAIXO do "Sair da conta" — que é o fim da tela, onde ninguém
// procura configuração: procura a saída. O grupo existia, mas no lugar onde não
// se lê.
//
// Isto é teste de POSIÇÃO, não de aparência, e existe porque a regressão é
// silenciosa: nada quebra se alguém mover o bloco de novo, e o item só some da
// vista de quem procura.
const RAIZ = path.resolve(__dirname, "../../..");
const ler = (p: string) => fs.readFileSync(path.join(RAIZ, p), "utf8");

describe("o grupo Sistema é item de lista, não rodapé", () => {
  it("nas Configurações do profissional, vem ANTES do Sair da conta", () => {
    const tela = ler("app/(professional)/settings.tsx");

    expect(tela.indexOf('<Grupo label="Sistema">')).toBeGreaterThan(-1);
    // Compara com o USO no JSX, nao com a definicao da funcao la em cima —
    // foi o que essa assercao pegou errado na primeira escrita.
    expect(tela.indexOf('<Grupo label="Sistema">')).toBeLessThan(
      tela.indexOf("onPress={handleLogout}")
    );
  });

  it("no Menu do dono, idem", () => {
    const tela = ler("app/(owner)/(tabs)/menu.tsx");

    expect(tela.indexOf('<Grupo label="SISTEMA">')).toBeGreaterThan(-1);
    expect(tela.indexOf('<Grupo label="SISTEMA">')).toBeLessThan(
      tela.indexOf("onPress={handleLogout}")
    );
  });

  it("as duas telas levam à MESMA tela de sistema", () => {
    for (const arq of ["app/(professional)/settings.tsx", "app/(owner)/(tabs)/menu.tsx"]) {
      expect(ler(arq)).toContain("/(professional)/sistema");
    }
  });
});
