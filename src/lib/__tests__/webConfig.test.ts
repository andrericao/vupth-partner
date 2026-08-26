import fs from "fs";
import path from "path";

// GUARDA DO CAMINHO WEB (D8 — distribuir por web E por lojas).
//
// Nenhuma destas quatro pecas quebra typecheck, lint ou teste de componente se
// sumir: o app continua compilando e o build nativo nem percebe. O que quebra e
// o SITE — e so em producao, depois do deploy. Por isso a guarda e aqui.

const ROOT = path.resolve(__dirname, "../../..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

describe("caminho web — configuracao de export", () => {
  const appJson = JSON.parse(read("app.json")).expo;

  it("declara `web.output` (sem isso o expo-router escolhe por conta)", () => {
    expect(appJson.web?.output).toBeDefined();
  });

  it("usa `single` — o app e client-side, com rotas atras de login", () => {
    // "static" geraria um HTML por rota, o que so faz sentido com conteudo
    // publico e indexavel. Aqui toda tela util esta atras de autenticacao.
    expect(appJson.web.output).toBe("single");
  });

  it("tem script de build web", () => {
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.scripts["build:web"]).toContain("expo export");
    expect(pkg.scripts["build:web"]).toContain("--platform web");
  });
});

describe("caminho web — arquivos que o host le", () => {
  // O Expo copia `public/` inteiro para a saida do export. Cloudflare Pages e
  // Netlify leem os dois arquivos abaixo sem configuracao extra.

  it("_headers traz o CSP (mitigacao do token em sessionStorage)", () => {
    const headers = read("public/_headers");
    expect(headers).toContain("Content-Security-Policy");
  });

  it("_redirects manda toda rota para o index (fallback de SPA)", () => {
    // Com `output: single` existe UM index.html. Sem esta regra, abrir
    // /login direto — ou dar F5 dentro do app — devolve 404 do host, nao a
    // tela. E o defeito classico de SPA em host estatico.
    const redirects = read("public/_redirects");
    expect(redirects).toMatch(/\/\*\s+\/index\.html\s+200/);
  });
});
