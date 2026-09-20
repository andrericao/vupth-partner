import fs from "fs";
import path from "path";

// 🔴 O "Xiaomi muito diferente" (15/09) era o navegador TRADUZINDO a página. O
// `lang: "pt-BR"` (18/09) tirou o motivo do convite, mas o Chrome guarda
// "traduzir sempre este site" POR DOMÍNIO: quem já aceitou uma vez continua com
// a página traduzida, e foi o que os prints do Andre de 18/09 mostraram —
// "Politica de preco (preview)" aparecendo como "Política de pré-visualização".
//
// E não é só texto trocado: a tradução reescreve o DOM por baixo do React e
// QUEBRA o campo controlado. No cadastro de serviço, R$ 60,00 chegava ao
// cálculo como R$ 0,06 e R$ 1.000,00 como R$ 0,01 — só o primeiro dígito
// sobrevivia. O preço e a máscara estão certos; o campo é que parava de receber
// as teclas seguintes.
//
// ⚠️ Um `app/+html.tsx` NAO resolve aqui: a web deste app e gerada como PAGINA
// UNICA (`web.output: "single"`) e, nesse formato, o Expo monta o index.html
// pelo modelo dele e ignora o arquivo — conferido no build local de 19/09. O
// pedido e feito no boot, pela propria pagina.
const layout = fs.readFileSync(path.resolve(__dirname, "../../../app/_layout.tsx"), "utf8");
const app = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../../app.json"), "utf8"));

describe("a página web pede para NÃO ser traduzida", () => {
  it("declara o idioma", () => {
    expect(app.expo.web.lang).toBe("pt-BR");
  });

  it("o boot da web pede para não traduzir", () => {
    expect(layout).toMatch(/Platform\.OS === "web"\) pedirParaNaoTraduzir\(\)/);
  });
});
