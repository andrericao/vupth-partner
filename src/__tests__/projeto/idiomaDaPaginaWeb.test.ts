import fs from "fs";
import path from "path";

// 🔴 O "Xiaomi muito diferente" (15/09) era o NAVEGADOR TRADUZINDO a página.
// O template web do Expo escreve `lang` a partir de `expo.web.lang` e, sem ele,
// assume "en" (@expo/cli, build/src/start/server/webTemplate.js). A página em
// português declarada como inglês vira alvo da tradução automática: "Início"
// virou "Não se trata de uma...", "Abrir estabelecimento" virou "Abrir
// estabelecer", "0 cadastrados" virou "0 cadastrado s". Nenhum desses textos
// existe no código — procurá-los lá custou dias.
//
// Achado pelo Front-Client em 17/09, nos prints do Andre do app do PARTNER.
const app = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../../../app.json"), "utf8")
);

describe("a página web declara o idioma", () => {
  it("expo.web.lang é pt-BR", () => {
    expect(app.expo.web.lang).toBe("pt-BR");
  });
});
