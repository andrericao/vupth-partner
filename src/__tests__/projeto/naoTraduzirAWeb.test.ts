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
// `notranslate` é o pedido explícito de não traduzir. Vive no documento web do
// Expo Router (app/+html.tsx), que é o único lugar onde dá para escrever <head>.
const doc = fs.readFileSync(path.resolve(__dirname, "../../../app/+html.tsx"), "utf8");

describe("a página web pede para NÃO ser traduzida", () => {
  it("declara o idioma", () => {
    expect(doc).toMatch(/lang="pt-BR"/);
  });

  it("marca a página como notranslate (meta e atributo)", () => {
    expect(doc).toMatch(/name="google"\s+content="notranslate"/);
    expect(doc).toMatch(/translate="no"/);
    expect(doc).toMatch(/className="notranslate"/);
  });
});
