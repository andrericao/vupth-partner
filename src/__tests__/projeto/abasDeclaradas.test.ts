import fs from "fs";
import path from "path";

const PASTA = path.resolve(__dirname, "../../../app/(professional)");
const LAYOUT = fs.readFileSync(path.join(PASTA, "_layout.tsx"), "utf8");

// GUARDA DAS ABAS DO RODAPE.
//
// 🔴 Achado real (Andre, 2026-09-14): a tela `sistema` aparecia como ABA no
// rodape do profissional. Ninguem a pos la — o expo-router registra como aba
// TODA tela da pasta que o layout nao declara, e ela era a unica sem declaracao.
//
// O modo de falha e silencioso e some no code review: criar um arquivo novo em
// `app/(professional)/` basta para uma aba nascer no rodape, sem que nenhuma
// linha mencione abas. Por isso a guarda e por AUSENCIA, nao por lista fixa:
// lista fixa envelhece a cada tela nova; esta cobra a declaracao.
describe("toda tela do profissional é declarada no layout", () => {
  const telas = fs
    .readdirSync(PASTA)
    .filter((f) => f.endsWith(".tsx") && f !== "_layout.tsx")
    .map((f) => f.replace(/\.tsx$/, ""));

  const declaradas = new Set(
    [...LAYOUT.matchAll(/<Tabs\.Screen\s+name="([a-z-]+)"/g)].map((m) => m[1])
  );

  it.each(telas)("%s está declarada (aba visível ou HIDDEN)", (tela) => {
    expect(declaradas.has(tela)).toBe(true);
  });

  it("o rodapé tem as QUATRO abas do desenho, e nada além", () => {
    // Quem some daqui vira aba fantasma; quem entra sem desenho vira surpresa.
    const visiveis = [...LAYOUT.matchAll(/<Tabs\.Screen[\s\S]{0,400}?name="([a-z-]+)"/g)]
      .map((m) => m[1])
      .filter((n) => !new RegExp(`name="${n}"\\s+options=\\{HIDDEN\\}`).test(LAYOUT));
    expect(visiveis).toEqual(["queue", "cut-requests", "my-day", "settings"]);
  });
});
